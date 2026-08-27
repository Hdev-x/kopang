package com.kopang.app.domain.point;

import com.kopang.app.domain.user.UserDTO;
import com.kopang.app.domain.user.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class PointServiceImpl implements PointService {

    private final PointMapper pointMapper;
    private final UserMapper userMapper;

    public PointServiceImpl(PointMapper pointMapper, UserMapper userMapper) {
        this.pointMapper = pointMapper;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public int getBalance(String email) {
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("회원을 찾을 수 없습니다");
        }
        Integer balance = pointMapper.getPointBalance(user.getUserId());
        return balance != null ? balance : 0;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PointHistoryDTO> getHistory(String email) {
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("회원을 찾을 수 없습니다");
        }
        return pointMapper.findPointHistoryByUserId(user.getUserId());
    }

    @Override
    public void earnPoints(String email, int amount, String type, String description) {
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("회원을 찾을 수 없습니다");
        }
        if (amount <= 0) {
            throw new IllegalArgumentException("적립할 포인트는 0보다 커야 합니다");
        }

        PointHistoryDTO history = PointHistoryDTO.builder()
                .userId(user.getUserId())
                .amount(amount) // 적립은 양수
                .type(type)
                .description(description)
                .build();
        pointMapper.insertPointHistory(history);
    }

    @Override
    public void usePoints(String email, int amount, String description) {
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("회원을 찾을 수 없습니다");
        }
        if (amount <= 0) {
            throw new IllegalArgumentException("사용할 포인트는 0보다 커야 합니다");
        }

        int currentBalance = getBalance(email);
        if (currentBalance < amount) {
            throw new IllegalArgumentException("보유하신 포인트가 부족합니다. (현재 잔액: " + currentBalance + "P)");
        }

        PointHistoryDTO history = PointHistoryDTO.builder()
                .userId(user.getUserId())
                .amount(-amount) // 사용(차감)은 음수
                .type("USED")
                .description(description)
                .build();
        pointMapper.insertPointHistory(history);
    }
}
