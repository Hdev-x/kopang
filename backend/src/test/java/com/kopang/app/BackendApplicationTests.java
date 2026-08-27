package com.kopang.app;

import com.kopang.app.domain.user.UserAddressDTO;
import com.kopang.app.domain.user.UserAddressMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class BackendApplicationTests {

	@Autowired
	private UserAddressMapper userAddressMapper;

	@Test
	void testFindByIdMapping() {
		System.out.println("=== TESTING findById MAPPING ===");
		try {
			UserAddressDTO found = userAddressMapper.findById(1L);
			if (found != null) {
				System.out.println("Found DTO: " + found);
				System.out.println("  -> addressId: " + found.getAddressId());
				System.out.println("  -> userId: " + found.getUserId());
				System.out.println("  -> detailAddress: " + found.getDetailAddress());
				System.out.println("  -> isDefault: " + found.getIsDefault());
			} else {
				System.out.println("Address with ID 1 not found!");
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		System.out.println("=================================");
	}

}
