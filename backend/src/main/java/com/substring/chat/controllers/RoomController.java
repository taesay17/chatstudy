package com.substring.chat.controllers;

import com.substring.chat.entities.Message;
import com.substring.chat.entities.Room;
import com.substring.chat.entities.RoomMember;
import com.substring.chat.entities.User;
import com.substring.chat.playload.AddMemberRequest;
import com.substring.chat.playload.CreateRoomRequest;
import com.substring.chat.playload.SendMessageRequest;
import com.substring.chat.repositories.MessageRepository;
import com.substring.chat.repositories.RoomMemberRepository;
import com.substring.chat.repositories.RoomRepository;
import com.substring.chat.repositories.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.substring.chat.playload.MemberDto;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/api/v1/rooms")
@CrossOrigin("http://localhost:*")
public class RoomController {

    private RoomRepository roomRepository;
    private MessageRepository messageRepository;
    private final RoomMemberRepository memberRepository;
    private final UserRepository userRepository;


    public RoomController(RoomRepository roomRepository,
                          MessageRepository messageRepository,
                          RoomMemberRepository memberRepository,
                          UserRepository userRepository) {
        this.roomRepository = roomRepository;
        this.messageRepository = messageRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
    }


    // ✅ GET /api/v1/rooms  -> список комнат
    @GetMapping
    public List<Room> getRooms() {
        return roomRepository.findAll();
    }

    @PostMapping("/{roomId}/messages")
    public ResponseEntity<?> sendTextMessage(
            @PathVariable String roomId,
            @RequestBody SendMessageRequest req
    ) {
        Room room = roomRepository.findByRoomId(roomId);
        if (room == null) return ResponseEntity.badRequest().body("Room not found!!");

        if (req.getContent() == null || req.getContent().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Message is empty");
        }

        Message m = new Message();
        m.setRoom(room);
        m.setSender(req.getSender());
        m.setContent(req.getContent());
        m.setType("TEXT");
        m.setTimeStamp(LocalDateTime.now());

        Message saved = messageRepository.save(m);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // ✅ POST /api/v1/rooms -> создать комнату (только teacher)
    @PostMapping
    public ResponseEntity<?> createRoom(@RequestBody String roomId) {

        if (!hasRole("TEACHER")) {
            return ResponseEntity.status(403).body("Only TEACHER can create rooms");
        }

        if (roomRepository.findByRoomId(roomId) != null) {
            return ResponseEntity.badRequest().body("Room already exists!");
        }

        Room room = new Room();
        room.setRoomId(roomId);
        Room savedRoom = roomRepository.save(room);

        // ✅ добавить создателя как участника
        String me = currentUsername();
        User teacher = userRepository.findByUsername(me).orElse(null);
        if (teacher != null) {
            RoomMember rm = new RoomMember();
            rm.setRoom(savedRoom);
            rm.setUser(teacher);
            memberRepository.save(rm);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(savedRoom);
    }
    @GetMapping("/{roomId}/members")
    public ResponseEntity<?> getMembers(@PathVariable String roomId) {
        String me = currentUsername();
        if (me == null) return ResponseEntity.status(401).body("Unauthorized");

        Room room = roomRepository.findByRoomId(roomId);
        if (room == null) return ResponseEntity.badRequest().body("Room not found");

        boolean isMember = memberRepository.existsByRoom_RoomIdAndUser_Username(roomId, me);
        if (!isMember && !hasRole("TEACHER")) {
            return ResponseEntity.status(403).body("You are not a participant of this room");
        }

        var members = memberRepository.findByRoom_RoomId(roomId).stream()
                .map(m -> new MemberDto(m.getUser().getUsername(), m.getUser().getRole().name()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(members);
    }
    @DeleteMapping("/{roomId}/members/{username}")
    public ResponseEntity<?> removeMember(@PathVariable String roomId,
                                          @PathVariable String username) {

        if (!hasRole("TEACHER")) {
            return ResponseEntity.status(403).body("Only TEACHER can remove participants");
        }

        Room room = roomRepository.findByRoomId(roomId);
        if (room == null) return ResponseEntity.badRequest().body("Room not found");

        if (!memberRepository.existsByRoom_RoomIdAndUser_Username(roomId, username)) {
            return ResponseEntity.badRequest().body("User is not in this room");
        }

        // (опционально) запретить удалять себя
        String me = currentUsername();
        if (me != null && me.equals(username)) {
            return ResponseEntity.badRequest().body("You cannot remove yourself");
        }

        memberRepository.deleteByRoom_RoomIdAndUser_Username(roomId, username);
        return ResponseEntity.ok("Removed: " + username);
    }





    // join room
    @GetMapping("/{roomId}")
    public ResponseEntity<?> joinRoom(@PathVariable String roomId) {
        String me = currentUsername();
        if (me == null) return ResponseEntity.status(401).body("Unauthorized");

        Room room = roomRepository.findByRoomId(roomId);
        if (room == null) return ResponseEntity.badRequest().body("Room not found!!");

        boolean isMember = memberRepository.existsByRoom_RoomIdAndUser_Username(roomId, me);

        // TEACHER можно разрешить входить в любую комнату
        if (!isMember && !hasRole("TEACHER")) {
            return ResponseEntity.status(403).body("You are not a participant of this room");
        }

        return ResponseEntity.ok(room);
    }



    // messages
    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<Message>> getMessages(
            @PathVariable String roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (roomRepository.findByRoomId(roomId) == null) {
            return ResponseEntity.badRequest().build();
        }

        Pageable pageable = PageRequest.of(page, size);
        List<Message> list = messageRepository
                .findByRoom_RoomIdOrderByTimeStampDesc(roomId, pageable)
                .getContent();

        return ResponseEntity.ok(list);
    }
    @PostMapping(value = "/{roomId}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadFile(
            @PathVariable String roomId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("sender") String sender
    ) {
        try {
            Room room = roomRepository.findByRoomId(roomId);
            if (room == null) {
                return ResponseEntity.badRequest().body("Room not found!!");
            }

            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }

            // ✅ uploads папка (создастся автоматически)
            Path uploadDir = Paths.get("uploads");
            Files.createDirectories(uploadDir);

            String original = file.getOriginalFilename();
            String safeOriginal = (original == null ? "file" : original.replaceAll("\\s+", "_"));
            String savedName = UUID.randomUUID() + "_" + safeOriginal;

            Path target = uploadDir.resolve(savedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            // URL, по которому фронт сможет открыть файл
            String fileUrl = "/uploads/" + savedName;

            Message m = new Message();
            m.setRoom(room);
            m.setSender(sender);
            m.setType("FILE");
            m.setContent(""); // можно оставить пустым
            m.setFileName(original);
            m.setFileUrl(fileUrl);
            m.setFileContentType(file.getContentType());
            m.setFileSize(file.getSize());
            m.setTimeStamp(LocalDateTime.now()); // ✅ твой формат

            Message saved = messageRepository.save(m);

            return ResponseEntity.status(HttpStatus.CREATED).body(saved);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Upload failed: " + e.getMessage());
        }
    }
    @PostMapping("/{roomId}/members")
    public ResponseEntity<?> addMember(@PathVariable String roomId,
                                       @RequestBody AddMemberRequest req) {

        if (!hasRole("TEACHER")) {
            return ResponseEntity.status(403).body("Only TEACHER can add participants");
        }

        Room room = roomRepository.findByRoomId(roomId);
        if (room == null) return ResponseEntity.badRequest().body("Room not found!!");

        if (req.getUsername() == null || req.getUsername().isBlank()) {
            return ResponseEntity.badRequest().body("Username is required");
        }

        User u = userRepository.findByUsername(req.getUsername()).orElse(null);
        if (u == null) return ResponseEntity.badRequest().body("User not found");

        if (memberRepository.existsByRoom_RoomIdAndUser_Username(roomId, u.getUsername())) {
            return ResponseEntity.badRequest().body("User already in room");
        }

        RoomMember rm = new RoomMember();
        rm.setRoom(room);
        rm.setUser(u);
        memberRepository.save(rm);

        return ResponseEntity.ok("Added: " + u.getUsername());
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyRooms() {
        String me = currentUsername();
        if (me == null) return ResponseEntity.status(401).body("Unauthorized");

        // TEACHER видит все комнаты (если хочешь) — можно оставить так
        if (hasRole("TEACHER")) {
            return ResponseEntity.ok(roomRepository.findAll());
        }

        // STUDENT видит только те, где он участник
        var memberships = memberRepository.findByUser_Username(me);
        var rooms = memberships.stream().map(RoomMember::getRoom).toList();
        return ResponseEntity.ok(rooms);
    }


    private String currentUsername() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        return a == null ? null : a.getName();
    }

    private boolean hasRole(String roleName) {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null) return false;
        return a.getAuthorities().stream()
                .anyMatch(x -> x.getAuthority().equals("ROLE_" + roleName));
    }


}
