package com.kopang.app.domain.user;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {

    // 회원검증
    public UserDTO detailByEmail(@Param("email") String email);

    public UserDTO detail(@Param("userId") Long userId);

    public int create(UserDTO userDTO);

    // 마지막으로 접속한 시간(이탈 방지용)
    public int updateLastLogin(@Param("userId") Long userId);

    public int update(UserDTO userDTO);

    public int delete(@Param("userId") Long userId);

    // 이름과 연락처로 가입된 회원 조회
    UserDTO findByNameAndPhone(@Param("name") String name, @Param("phone") String phone);

    // 전화번호로 가입된 회원 조회 (중복 체크용)
    UserDTO findByPhone(@Param("phone") String phone);
}
