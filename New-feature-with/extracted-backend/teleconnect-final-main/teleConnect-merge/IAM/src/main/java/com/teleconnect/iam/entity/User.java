package com.teleconnect.iam.entity;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "users") 
@Data
public class User {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String password; // BCrypt hash — never plain text

    @Column(unique = true, length = 10)
    private String phone;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role; // FK ® roles table

    private Integer regionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 1)
    private Status status = Status.A;

    @Column(nullable = false)
    private Boolean mustChangePassword = false;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    // A = Active, S = Suspended, I = Inactive
    public enum Status {
        A("ACTIVE"), S("SUSPENDED"), I("INACTIVE");

        private final String label;

        Status(String label) { this.label = label; }

        /** Single-letter code persisted to the DB (same as the enum name). */
        public String getCode() { return name(); }

        /** Human-readable label, e.g. "ACTIVE". */
        public String getLabel() { return label; }
    }
}