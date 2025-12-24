package com.substring.chat.controllers;

import com.substring.chat.entities.Message;
import com.substring.chat.entities.Room;
import com.substring.chat.playload.CreateRoomRequest;
import com.substring.chat.repositories.MessageRepository;
import com.substring.chat.repositories.RoomRepository;
import lombok.Getter;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.data.domain.Pageable;


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
}
