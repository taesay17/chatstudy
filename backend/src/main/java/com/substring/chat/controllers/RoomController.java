package com.substring.chat.controllers;

import com.substring.chat.entities.Message;
import com.substring.chat.entities.Room;
import com.substring.chat.playload.CreateRoomRequest;
import com.substring.chat.playload.SendMessageRequest;
import com.substring.chat.repositories.MessageRepository;
import com.substring.chat.repositories.RoomRepository;
import lombok.Getter;
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

    public RoomController(RoomRepository roomRepository,
                          MessageRepository messageRepository) {
        this.roomRepository = roomRepository;
        this.messageRepository = messageRepository;
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
    public ResponseEntity<?> createRoom(@RequestBody CreateRoomRequest req) {

        String roomId = req.getRoomId();

        if (roomRepository.findByRoomId(roomId) != null) {
            return ResponseEntity.badRequest().body("Room already exists!");
        }

        Room room = new Room();
        room.setRoomId(roomId);
        roomRepository.save(room);

        return ResponseEntity.status(HttpStatus.CREATED).body(room);
    }


    // join room
    @GetMapping("/{roomId}")
    public ResponseEntity<?> joinRoom(@PathVariable String roomId) {
        Room room = roomRepository.findByRoomId(roomId);
        if (room == null) {
            return ResponseEntity.badRequest().body("Room not found!!"); // 👈 400
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
}
