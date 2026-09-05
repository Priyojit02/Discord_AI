package com.discord.app.repository;

import com.discord.app.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, Long> {
    Page<Message> findByChannelIdOrderByCreatedAtDesc(Long channelId, Pageable pageable);
    Page<Message> findByDirectMessageIdOrderByCreatedAtDesc(Long dmId, Pageable pageable);
}
