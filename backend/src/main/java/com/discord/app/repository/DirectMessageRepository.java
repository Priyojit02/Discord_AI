package com.discord.app.repository;

import com.discord.app.entity.DirectMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {

    @Query("SELECT dm FROM DirectMessage dm WHERE (dm.sender.id = :userId1 AND dm.receiver.id = :userId2) OR (dm.sender.id = :userId2 AND dm.receiver.id = :userId1)")
    Optional<DirectMessage> findConversation(Long userId1, Long userId2);

    @Query("SELECT dm FROM DirectMessage dm WHERE dm.sender.id = :userId OR dm.receiver.id = :userId")
    List<DirectMessage> findAllByUserId(Long userId);
}
