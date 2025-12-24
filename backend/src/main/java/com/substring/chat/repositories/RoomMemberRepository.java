package com.substring.chat.repositories;

import com.substring.chat.entities.RoomMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {
    boolean existsByRoom_RoomIdAndUser_Username(String roomId, String username);
    List<RoomMember> findByUser_Username(String username);
    List<RoomMember> findByRoom_RoomId(String roomId);
    void deleteByRoom_RoomIdAndUser_Username(String roomId, String username);

}
