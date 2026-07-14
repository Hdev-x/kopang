package com.kopang.app.domain.user;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface UserAddressMapper {
    // 기본 배송지 조회
    UserAddressDTO findDefaultByUserId(@Param("userId") Long userId);

    // 배송지 단건 조회 (권한 검증용)
    UserAddressDTO findById(@Param("addressId") Long addressId);

    // 전체 배송지 조회
    List<UserAddressDTO> findAllByUserId(@Param("userId") Long userId);

    // 배송지 추가
    void insert(UserAddressDTO address);

    // 배송지 수정
    void update(UserAddressDTO address);

    // 배송지 삭제
    void delete(@Param("addressId") Long addressId);

    // 모든 배송지의 기본 배송지 설정 해제
    void clearDefault(@Param("userId") Long userId);
}
