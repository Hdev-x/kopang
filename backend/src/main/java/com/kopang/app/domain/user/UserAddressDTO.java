package com.kopang.app.domain.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAddressDTO {
    private Long addressId;
    private Long userId;
    private String receiver;
    private String phone;
    private String zipcode;
    private String address;
    private String detailAddress;
    private Boolean isDefault;
}
