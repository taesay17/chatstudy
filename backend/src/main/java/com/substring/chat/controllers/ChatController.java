package com.substring.chat.controllers;

import com.substring.chat.entities.Message;
import com.substring.chat.entities.Room;
import com.substring.chat.playload.MessageRequest;
import com.substring.chat.repositories.MessageRepository;
import com.substring.chat.repositories.RoomRepository;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.LocalDateTime;

@Controller
@CrossOrigin("http://localhost:*")
public class ChatController {


    private final RoomRepository roomRepository;
    private final MessageRepository messageRepository;

    public ChatController(RoomRepository roomRepository, MessageRepository messageRepository) {
        this.roomRepository = roomRepository;
        this.messageRepository = messageRepository;
    }


    @MessageMapping("/sendMessage/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public Message sendMessage(@DestinationVariable String roomId, MessageRequest request) {

        Room room = roomRepository.findByRoomId(roomId);
        if (room == null) throw new RuntimeException("room not found !!");

        Message message = new Message();
        message.setSender(request.getSender());
        message.setContent(request.getContent());
        message.setType(request.getType());       // TEXT/FILE
        message.setFileUrl(request.getFileUrl()); // null для TEXT
        message.setTimeStamp(LocalDateTime.now());

        message.setRoom(room); // ✅ связь

        Message saved = messageRepository.save(message); // ✅ сохраняем message
        return saved; // ✅ вернётся без room (из-за @JsonIgnore)
    }





}
