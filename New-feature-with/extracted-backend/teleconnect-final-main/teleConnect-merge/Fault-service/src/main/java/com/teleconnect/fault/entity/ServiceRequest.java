package com.teleconnect.fault.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "service_request")
@Data
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "requestId")
    private Integer requestId;

    // accountId from Module 2.2 — stored as plain Integer, no @ManyToOne
    @Column(name = "accountId", nullable = true)
    private Integer accountId;

    // lineId from Module 2.2 — stored as plain Integer, no @ManyToOne
    @Column(name = "lineId", nullable = true)
    private Integer lineId;

    @Enumerated(EnumType.STRING)
    @Column(name = "requestType", nullable = false)
    private RequestType requestType;

    // requestedBy from Module 4.1 — stored as plain Integer, no @ManyToOne
    @Column(name = "requestedBy", nullable = false)
    private Integer requestedBy;

    @Column(name = "raisedDate", nullable = false)
    private LocalDate raisedDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RequestStatus status = RequestStatus.O;

    @Column(name = "preferredAccountType")
    private String preferredAccountType;

    @Column(name = "idProofReference")
    private String idProofReference;

    @Column(name = "preferredPlanId")
    private Integer preferredPlanId;

    public enum RequestType {
        PlanChange, SIMReplacement, PortingRequest, AccountUpdate, NewConnection
    }

    public enum RequestStatus {
        O, P, C, X
        // O=Open  P=InProgress  C=Completed  X=Cancelled
    }
}
