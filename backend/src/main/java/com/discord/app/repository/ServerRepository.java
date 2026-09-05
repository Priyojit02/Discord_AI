package com.discord.app.repository;

import com.discord.app.entity.Server;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ServerRepository extends JpaRepository<Server, Long> {
    Optional<Server> findByInviteCode(String inviteCode);

    @Query("SELECT s FROM Server s JOIN s.members m WHERE m.id = :userId")
    List<Server> findAllByMemberId(Long userId);
}
