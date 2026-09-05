package com.discord.app.repository;

import com.discord.app.entity.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface ReactionRepository extends JpaRepository<Reaction, Long> {

    List<Reaction> findByMessageId(Long messageId);

    Optional<Reaction> findByMessageIdAndUserIdAndEmoji(Long messageId, Long userId, String emoji);

    @Transactional
    @Modifying
    @Query("DELETE FROM Reaction r WHERE r.message.id = :messageId AND r.user.id = :userId AND r.emoji = :emoji")
    void deleteByMessageIdAndUserIdAndEmoji(Long messageId, Long userId, String emoji);

    @Transactional
    @Modifying
    @Query("DELETE FROM Reaction r WHERE r.message.id = :messageId")
    void deleteAllByMessageId(Long messageId);
}
