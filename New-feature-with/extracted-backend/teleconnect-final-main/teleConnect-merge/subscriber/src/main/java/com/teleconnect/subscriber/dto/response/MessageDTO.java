package com.teleconnect.subscriber.dto.response;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MessageDTO {
    private String message;
    private Integer accountId;
    private Integer lineId;

    public MessageDTO(String message) {
        this.message = message;
    }

    public MessageDTO(String message, Integer accountId) {
        this.message = message;
        this.accountId = accountId;
    }
}