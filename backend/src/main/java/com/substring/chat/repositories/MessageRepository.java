package com.substring.chat.repositories;

import com.substring.chat.entities.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, Long> {
    Page<Message> findByRoom_RoomIdOrderByTimeStampDesc(String roomId, Pageable pageable);
}

