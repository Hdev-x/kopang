package com.kopang.app.domain.membership;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MembershipDTO {

    private Long membershipId;
    private String name;
    private int price;
    private int discountRate;
    private String description;
}
