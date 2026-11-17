import { BlogPost } from '../types';

export const BLOG_POSTS: BlogPost[] = [
  // =========================================================================
  // TRỤ CỘT 01: BÁC SĨ GIA ĐÌNH RIÊNG
  // =========================================================================
  {
    id: 'post-pillar-01',
    slug: 'bac-si-gia-dinh-rieng',
    pillarNum: 'Trụ Cột 01',
    pillarBadge: 'Thăm khám tại gia',
    icon: 'home_health',
    title: 'Bác Sĩ Gia Đình Riêng: Hướng Dẫn Mô Hình Chăm Sóc Sức Khỏe Tận Gia',
    subtitle: 'Hiện diện y tế tận gia kín đáo, quản lý sức khỏe liên tục và cá nhân hóa cho từng thế hệ.',
    excerpt:
      'Tìm hiểu quy trình bác sĩ gia đình thăm khám tại nhà hàng tháng, cách thu thập tiền sử bệnh án gia tộc và thiết lập phác đồ theo dõi bệnh mạn tính chuẩn Bộ Y Tế.',
    category: 'pillar',
    categoryLabel: 'Trụ Cột Y Tế Gia Đình',
    author: {
      name: 'ThS.BS Lê Hoàng Nam',
      role: 'Trưởng Ban Hội Chẩn Lão Khoa & Y học Gia đình • 22 năm KN',
      avatar: '/images/medsev/home-one/doctor/3.jpg',
    },
    publishedAt: '28/10/2026',
    readTime: '6 phút đọc',
    coverImage: '/images/register_doctor_family.jpg',
    learningObjectives: [
      'Hiểu rõ sự khác biệt giữa Bác sĩ Gia đình và Bác sĩ khám lâm sàng thông thường.',
      'Nắm vững quy trình một buổi thăm khám y tế định kỳ tận nhà (Home Visit).',
      'Cách bác sĩ xây dựng hồ sơ tiền sử gia tộc và dự phòng rủi ro tim mạch, chuyển hóa.',
      'Quy chuẩn giới hạn định mức 150 hộ gia đình/bác sĩ để đảm bảo chất lượng thời gian chăm sóc.',
    ],
    overview:
      'Trong mô hình y tế truyền thống, người bệnh chỉ tìm đến cơ sở y tế khi xuất hiện triệu chứng cấp tính hoặc bệnh đã diễn tiến nặng. Mô hình Bác sĩ Gia đình FamiDoc đảo ngược hoàn toàn quy trình này: Bác sĩ chủ động hiện diện định kỳ tại tư gia, trở thành người bảo trợ chuyên môn, thấu hiểu lối sống, gen di truyền và tâm lý của từng thành viên trong gia đình.',
    steps: [
      {
        stepNumber: '01',
        title: 'Khảo sát Tiền sử Y khoa & Bản đồ Bệnh lý Gia tộc',
        content:
          'Trong lần thăm khám đầu tiên, bác sĩ gia đình dành 60 - 90 phút thu thập chi tiết tiền sử bệnh lý của 3 thế hệ (ông bà, cha mẹ, con cái). Bản đồ phả hệ y khoa giúp nhận diện sớm các nguy cơ di truyền như tăng huyết áp sớm, đái tháo đường type 2, ung thư đại trực tràng hoặc rối loạn mỡ máu.',
        note: 'Thông tin này được mã hóa bảo mật và tích hợp trực tiếp vào Hồ sơ bệnh án điện tử EHR của gia đình.',
      },
      {
        stepNumber: '02',
        title: 'Thăm khám Lâm sàng Định kỳ Tận nhà Hàng tháng',
        content:
          'Mỗi tháng, bác sĩ gia đình cùng điều dưỡng mang trang thiết bị di động chuẩn y khoa (máy đo điện tim 3 cần di động, máy đo SpO2, đo huyết áp Omron chuẩn lâm sàng, test nhanh đường huyết và que thử nước tiểu) đến tận tư gia để kiểm tra các chỉ số sinh tồn và khám cơ quan.',
      },
      {
        stepNumber: '03',
        title: 'Rà soát Tủ thuốc Gia đình & Tương tác Dược lý',
        content:
          'Bác sĩ kiểm tra toàn bộ các đơn thuốc đang sử dụng của các thành viên (đặc biệt là người cao tuổi có nhiều bệnh nền), loại bỏ thuốc hết hạn, ngăn chặn tình trạng tương tác thuốc có hại (Drug-Drug Interactions) và tư vấn thời điểm uống thuốc tối ưu.',
      },
      {
        stepNumber: '04',
        title: 'Điều phối Chuyển tuyến Khẩn cấp Fast-Track khi Cần thiết',
        content:
          'Nếu phát hiện dấu hiệu cảnh báo nguy hiểm (nhồi máu cơ tim thầm lặng, cơn thiếu máu não thoáng qua TIA), bác sĩ gia đình trực tiếp kích hoạt quy trình Chuyển viện Fast-Track đến Bệnh viện Đa khoa đối tác, bệnh nhân vào thẳng phòng can thiệp mà không cần qua khâu chờ khám sàng lọc ban đầu.',
      },
    ],
    faqs: [
      {
        question: 'Bác sĩ gia đình có kê đơn thuốc bảo hiểm y tế được không?',
        answer:
          'Bác sĩ gia đình FamiDoc được cấp Chứng chỉ hành nghề (CCHN) hợp lệ và hoạt động dưới sự bảo trợ chuyên môn của Cơ sở Y tế đối tác. Bác sĩ kê đơn thuốc điện tử hợp pháp theo chuẩn của Bộ Y Tế và hỗ trợ liên thông đơn thuốc với các nhà thuốc liên kết.',
      },
      {
        question: 'Tại sao FamiDoc giới hạn tối đa 150 hộ gia đình cho mỗi bác sĩ?',
        answer:
          'Theo quy chuẩn an toàn BR-04 của FamiDoc, giới hạn 150 hộ đảm bảo bác sĩ có đủ thời gian dành tối thiểu 45-60 phút cho mỗi lượt khám tại nhà, đồng thời luôn sẵn sàng tiếp nhận cuộc gọi Telehealth và phản hồi tin nhắn trong vòng 15 phút.',
      },
    ],
    keyTakeaways: [
      'Bác sĩ gia đình là người gác cổng sức khỏe tin cậy của toàn bộ gia tộc.',
      'Khám tại nhà giúp phát hiện sớm đến 80% nguy cơ mạn tính trước khi có triệu chứng lâm sàng.',
      'Tiết kiệm trung bình 65% thời gian chờ đợi và giảm 40% chi phí nhập viện không cần thiết.',
    ],
    tags: ['Bác sĩ gia đình', 'Khám tận nhà', 'Y học dự phòng', 'Sức khỏe gia tộc'],
  },

  // =========================================================================
  // TRỤ CỘT 02: TƯ VẤN TELEHEALTH 24/7
  // =========================================================================
  {
    id: 'post-pillar-02',
    slug: 'tu-van-telehealth-247',
    pillarNum: 'Trụ Cột 02',
    pillarBadge: 'Hỗ trợ 24/7',
    icon: 'video_camera_front',
    title: 'Tư Vấn Telehealth 24/7: Quy Trình Khám Bệnh Từ Xa & Xử Trí Khẩn Cấp',
    subtitle: 'Kết nối video HD trực tiếp với bác sĩ phụ trách mọi lúc mọi nơi, an toàn và bảo mật theo chuẩn Bộ Y Tế.',
    excerpt:
      'Hướng dẫn các bước kết nối cuộc gọi video y khoa, nguyên tắc mô tả triệu chứng qua màn hình, xử trí sốt co giật ở trẻ nhỏ hoặc tăng huyết áp kịch phát ban đêm.',
    category: 'pillar',
    categoryLabel: 'Trụ Cột Y Tế Gia Đình',
    author: {
      name: 'BS.CKII Trần Mai Phương',
      role: 'Trưởng Đơn Nguyên Cấp Cứu & Điều Phối Telemedicine • 18 năm KN',
      avatar: '/images/medsev/home-one/doctor/2.jpg',
    },
    publishedAt: '25/10/2026',
    readTime: '5 phút đọc',
    coverImage: '/images/famidoc_family_hero.jpg',
    learningObjectives: [
      'Nắm rõ cách khởi tạo cuộc gọi Telehealth chuẩn WebRTC trên ứng dụng FamiDoc.',
      'Biết cách chuẩn bị các chỉ số sinh tồn cơ bản trước khi bác sĩ bắt đầu kết nối video.',
      'Nhận biết các tình huống y tế có thể xử lý qua Telehealth và tình huống cần gọi xe cấp cứu 115.',
      'Hiểu quy trình kê đơn thuốc điện tử và giao thuốc tận nhà sau cuộc tư vấn từ xa.',
    ],
    overview:
      'Dịch vụ Telehealth 24/7 của FamiDoc không đơn thuần là một cuộc gọi video thông thường, mà là một phòng khám ảo tích hợp đầy đủ công cụ lâm sàng: bác sĩ xem được biểu đồ sinh hiệu thời gian thực, đọc hồ sơ bệnh án EHR và kê toa thuốc điện tử có chữ ký số ngay trong phiên gọi.',
    steps: [
      {
        stepNumber: '01',
        title: 'Bấm Nút "Gọi Bác Sĩ Phụ Trách" trên Dashboard Gia Đình',
        content:
          'Chủ hộ hoặc thành viên chỉ cần mở ứng dụng FamiDoc, chọn thành viên đang cần khám và nhấn "Kết nối Bác sĩ". Hệ thống tự động định tuyến trực tiếp đến Bác sĩ Gia đình phụ trách gia đình bạn hoặc Bác sĩ trực thường trực 24/7.',
      },
      {
        stepNumber: '02',
        title: 'Mô Tả Triệu Chứng & Cung Cấp Số Đo Sinh Hiệu',
        content:
          'Trước hoặc trong khi gọi, người bệnh nhập các chỉ số đo nhanh tại nhà (nhiệt độ cơ thể, huyết áp tâm thu/tâm trương, nồng độ oxy SpO2). Camera góc rộng giúp bác sĩ quan sát sắc diện, nhịp thở và các tổn thương ngoài da.',
        note: 'Đảm bảo ngồi ở nơi đủ ánh sáng và đường truyền mạng ổn định để hình ảnh video hiển thị rõ nét.',
      },
      {
        stepNumber: '03',
        title: 'Hướng Dẫn Sơ Cứu & Can Thiệp Tức Thời',
        content:
          'Đối với các ca sốt cao ở trẻ nhỏ, nôn ói dị ứng hoặc cơn đau bụng cấp, bác sĩ sẽ hướng dẫn người nhà từng bước sơ cứu chuẩn y khoa, liều lượng hạ sốt theo cân nặng và theo dõi các dấu hiệu nguy hiểm cần chuyển viện.',
      },
      {
        stepNumber: '04',
        title: 'Kê Toa Thuốc Điện Tử & Đặt Lịch Tái Khám',
        content:
          'Kết thúc buổi tư vấn, bác sĩ xuất toa thuốc điện tử kèm chữ ký số y khoa. Đơn thuốc được đồng bộ sang cổng dược phẩm đối tác để giao tận nhà trong vòng 2 giờ (khu vực nội thành).',
      },
    ],
    faqs: [
      {
        question: 'Cuộc gọi Telehealth có bị giới hạn thời gian không?',
        answer:
          'Không. Thời lượng cuộc gọi hoàn toàn do bác sĩ quyết định dựa trên mức độ phức tạp của triệu chứng cho đến khi người bệnh được giải đáp thỏa đáng và có phác đồ xử trí rõ ràng.',
      },
      {
        question: 'Dữ liệu hình ảnh và âm thanh cuộc gọi có được bảo mật không?',
        answer:
          'Toàn bộ cuộc gọi video được mã hóa đầu cuối chuẩn TLS/WebRTC theo quy định về Bảo vệ Dữ liệu Cá nhân (Nghị định 13/2023/NĐ-CP) và chuẩn HIPAA quốc tế.',
      },
    ],
    keyTakeaways: [
      'Giải tỏa 85% nỗi lo âu y tế ban đêm chỉ sau 3 phút kết nối.',
      'Tránh việc tự ý mua kháng sinh hoặc uống nhầm thuốc không rõ nguồn gốc.',
      'Hồ sơ cuộc gọi và toa thuốc được lưu tự động vào bệnh án EHR.',
    ],
    tags: ['Telehealth', 'Khám từ xa', 'Cấp cứu 24/7', 'Kê đơn điện tử'],
  },

  // =========================================================================
  // TRỤ CỘT 03: PHÁC ĐỒ DINH DƯỠNG CÁ NHÂN
  // =========================================================================
  {
    id: 'post-pillar-03',
    slug: 'phac-do-dinh-duong-ca-nhan',
    pillarNum: 'Trụ Cột 03',
    pillarBadge: 'Cá nhân hóa',
    icon: 'nutrition',
    title: 'Phác Đồ Dinh Dưỡng Cá Nhân: Chiến Lược Y Học Dự Phòng Bệnh Mạn Tính',
    subtitle: 'Thiết kế thực đơn dinh dưỡng theo chỉ số xét nghiệm sinh hóa, lối sống và bệnh lý chuyển hóa.',
    excerpt:
      'Khám phá cách chuyên gia dinh dưỡng FamiDoc phối hợp cùng bác sĩ gia đình xây dựng chế độ ăn kiểm soát huyết áp, hạ đường huyết HbA1c và bảo vệ tế bào gan thận.',
    category: 'pillar',
    categoryLabel: 'Trụ Cột Y Tế Gia Đình',
    author: {
      name: 'TS.BS Nguyễn Thùy Trang',
      role: 'Chuyên gia Dinh dưỡng Lâm sàng & Tiết chế • Viện Dinh Dưỡng',
      avatar: '/images/medsev/home-one/doctor/4.jpg',
    },
    publishedAt: '20/10/2026',
    readTime: '7 phút đọc',
    coverImage: '/images/register_family_care.jpg',
    learningObjectives: [
      'Hiểu mối liên hệ nhân - quả giữa dinh dưỡng hàng ngày và các bệnh lý mạn tính không lây.',
      'Phương pháp phân tích chỉ số xét nghiệm máu (Glucose, HbA1c, Cholesterol, Axit Uric) thành thực đơn.',
      'Nguyên tắc áp dụng chế độ ăn DASH (chống tăng huyết áp) và Địa Trung Hải phù hợp với ẩm thực Việt Nam.',
      'Cách theo dõi nhật ký thực phẩm trên ứng dụng FamiDoc để bác sĩ phản hồi định kỳ.',
    ],
    overview:
      'Thuốc điều trị chỉ giải quyết phần ngọn của bệnh lý mạn tính; gốc rễ nằm ở dinh dưỡng và lối sống hàng ngày. Trụ cột dinh dưỡng của FamiDoc cá nhân hóa từng gam đạm, lượng tinh bột và khoáng chất dựa trên kết quả xét nghiệm sinh hóa thực tế của từng thành viên trong gia đình.',
    steps: [
      {
        stepNumber: '01',
        title: 'Phân Tích Bảng Đánh Giá Khẩu Phần & Chỉ Số Sinh Hóa',
        content:
          'Dựa trên kết quả xét nghiệm máu định kỳ (Lipid máu, Men gan, Độ lọc cầu thận eGFR, Axit uric) và thói quen ăn uống gia đình, chuyên gia dinh dưỡng tính toán chính xác nhu cầu Calo và tỷ lệ các nhóm chất Đạm - Đường - Béo cần thiết.',
      },
      {
        stepNumber: '02',
        title: 'Xây Dựng Thực Đơn 7 Ngày Thuần Việt Cá Nhân Hóa',
        content:
          'Không áp dụng các chế độ ăn kiêng hà khắc phương Tây khó theo đuổi, FamiDoc thiết kế thực đơn dựa trên các nguyên liệu chợ Việt quen thuộc (cá đồng, rau củ quả theo mùa, gạo lứt, các loại đậu) nhưng kiểm soát nghiêm ngặt lượng muối Natri và dầu mỡ bão hòa.',
        note: 'Có thực đơn riêng cho người cao tuổi suy giảm men tiêu hóa hoặc trẻ em biếng ăn thiếu vi chất.',
      },
      {
        stepNumber: '03',
        title: 'Tập Luyện Vận Động Phục Hồi Thể Lực Đi Kèm',
        content:
          'Bác sĩ gia đình kê đơn vận động: thời lượng đi bộ, các bài tập kháng lực nhẹ nhàng hoặc yoga dưỡng sinh cho người cao tuổi, giúp tế bào tăng nhạy cảm với Insulin và cải thiện tuần hoàn tim mạch.',
      },
      {
        stepNumber: '04',
        title: 'Đánh Giá Lại Chỉ Số Sinh Hóa Sau 90 Ngày',
        content:
          'Sau 3 tháng thực hiện phác đồ, bác sĩ thực hiện xét nghiệm đối chứng tại nhà để kiểm tra sự suy giảm của mỡ máu xấu LDL-C, mức độ ổn định của đường huyết và tiến hành tinh chỉnh khẩu phần ăn phù hợp với thể trạng mới.',
      },
    ],
    faqs: [
      {
        question: 'Tôi có phải nấu riêng từng món ăn cho người bệnh trong nhà không?',
        answer:
          'Không cần thiết. Chuyên gia dinh dưỡng sẽ hướng dẫn cách nấu một nồi ăn chung cho cả gia đình, chỉ cần nêm nếm nhạt từ đầu và người có bệnh nền lấy phần trước khi nêm thêm gia vị cho người trẻ.',
      },
      {
        question: 'Phác đồ dinh dưỡng có giúp tôi giảm liều thuốc đang uống không?',
        answer:
          'Rất nhiều bệnh nhân tuân thủ tốt chế độ dinh dưỡng DASH sau 3-6 tháng đã được bác sĩ gia đình giảm liều thuốc huyết áp và thuốc hạ mỡ máu một cách an toàn.',
      },
    ],
    keyTakeaways: [
      'Dinh dưỡng đúng là liều thuốc tự nhiên mạnh mẽ nhất.',
      'Giảm 5g muối/ngày giúp hạ 5-8 mmHg huyết áp mà không cần tăng liều thuốc.',
      'Cả gia đình cùng ăn uống lành mạnh tạo động lực gắn kết và thay đổi lâu dài.',
    ],
    tags: ['Dinh dưỡng cá nhân', 'Phòng ngừa tim mạch', 'Chế độ ăn DASH', 'Tiểu đường'],
  },

  // =========================================================================
  // TRỤ CỘT 04: HỒ SƠ BỆNH ÁN ĐIỆN TỬ (EHR - HL7 FHIR)
  // =========================================================================
  {
    id: 'post-pillar-04',
    slug: 'ho-so-benh-an-dien-tu-ehr',
    pillarNum: 'Trụ Cột 04',
    pillarBadge: 'Chuẩn HL7 FHIR',
    icon: 'clinical_notes',
    title: 'Hồ Sơ Bệnh Án Điện Tử EHR: Biên Niên Sử Y Bạ Gia Tộc Liên Thông Tuyến Đầu',
    subtitle: 'Lưu trữ trọn đời lịch sử khám chữa bệnh, mã hóa dữ liệu theo chuẩn HIPAA và liên thông bệnh viện tuyến trung ương.',
    excerpt:
      'Hướng dẫn truy cập hồ sơ bệnh án điện tử EHR trên FamiDoc, cách chia sẻ dữ liệu an toàn cho bác sĩ hội chẩn và theo dõi biểu đồ chỉ số sinh hiệu theo năm tháng.',
    category: 'pillar',
    categoryLabel: 'Trụ Cột Y Tế Gia Đình',
    author: {
      name: 'PGS.TS Nguyễn Trọng Nghĩa',
      role: 'Đại diện Đối tác Bệnh viện Đại học Y Dược & Chuyên gia Tin học Y tế',
      avatar: '/images/medsev/home-one/doctor/1.jpg',
    },
    publishedAt: '15/10/2026',
    readTime: '6 phút đọc',
    coverImage: '/images/famidoc_register_hero.png',
    learningObjectives: [
      'Hiểu rõ lợi ích vượt trội của EHR so với sổ khám bệnh giấy truyền thống.',
      'Biết cách đọc và theo dõi biểu đồ biến thiên huyết áp, đường huyết trên Dashboard.',
      'Nắm vững quyền riêng tư: phân quyền ai được xem hồ sơ sức khỏe của từng thành viên.',
      'Quy trình xuất file dữ liệu chuẩn HL7 FHIR khi cần chuyển viện hoặc đi nước ngoài.',
    ],
    overview:
      'Hồ sơ bệnh án giấy truyền thống thường bị thất lạc, rách nát hoặc không mang theo đúng lúc khẩn cấp. Hồ sơ bệnh án điện tử EHR của FamiDoc đóng vai trò như một "Biên niên sử y bạ" trọn đời: mọi kết quả xét nghiệm, hình ảnh X-quang, MRI, lịch sử dị ứng thuốc và ghi chú của bác sĩ đều được số hóa và liên thông đa nền tảng.',
    steps: [
      {
        stepNumber: '01',
        title: 'Tập Trung Hóa Mọi Dữ Liệu Khám Chữa Bệnh vào 1 Nền Tảng',
        content:
          'Dù khám tại nhà, gọi Telehealth hay đi chụp chiếu tại bệnh viện đối tác, toàn bộ kết quả xét nghiệm PDF, hình ảnh chẩn đoán DICOM đều tự động đổ về hồ sơ EHR của gia đình bạn trên FamiDoc Cloud.',
      },
      {
        stepNumber: '02',
        title: 'Cảnh Báo Thông Minh về Dị Ứng Thuốc & Chống Chỉ Định',
        content:
          'Hệ thống tự động quét lịch sử dị ứng (ví dụ: dị ứng Penicillin, Aspirin). Khi bất kỳ bác sĩ nào kê đơn thuốc mới, AI sẽ cảnh báo tức thì nếu phát hiện thành phần có nguy cơ phản vệ hoặc tương tác bất lợi.',
        note: 'Giúp giảm thiểu 95% tai biến do nhầm lẫn hoặc quên thông báo tiền sử dị ứng thuốc.',
      },
      {
        stepNumber: '03',
        title: 'Phân Quyền Xem Hồ Sơ & Bảo Mật Chuẩn Y Khoa HIPAA',
        content:
          'Chủ hộ có toàn quyền phân quyền truy cập: ai trong gia đình được xem hồ sơ của ai, và cấp quyền truy cập tạm thời (Temporary Token) có thời hạn cho bác sĩ hội chẩn bên ngoài khi cần thiết.',
      },
      {
        stepNumber: '04',
        title: 'Liên Thông Tuyến Trung Ương & Xuất Báo Cáo HL7 FHIR',
        content:
          'Khi gia đình đi du lịch, công tác hoặc chuyển tuyến sang các bệnh viện tuyến đầu (Bạch Mai, Chợ Rẫy, ĐHYD), bác sĩ chỉ cần quét mã QR bệnh nhân để đọc ngay toàn bộ lịch sử bệnh án mà không cần làm lại các xét nghiệm tốn kém.',
      },
    ],
    faqs: [
      {
        question: 'Dữ liệu sức khỏe gia đình tôi có bị rò rỉ cho bên bảo hiểm hay quảng cáo không?',
        answer:
          'Tuyệt đối không. Dữ liệu y tế của FamiDoc được bảo vệ nghiêm ngặt theo Nghị định 13/2023/NĐ-CP và tiêu chuẩn bảo mật y tế quốc tế HIPAA. FamiDoc cam kết không chia sẻ hoặc bán dữ liệu cho bất kỳ bên thứ ba nào.',
      },
      {
        question: 'Tôi có thể tự tải kết quả khám bệnh từ các bệnh viện khác lên EHR được không?',
        answer:
          'Hoàn toàn được. Ứng dụng hỗ trợ chụp ảnh phiếu khám, kết quả máu hoặc tải tệp PDF lên. Đội ngũ trợ lý y khoa sẽ thẩm định và số hóa dữ liệu vào đúng danh mục bệnh án.',
      },
    ],
    keyTakeaways: [
      'Không bao giờ lo lắng mất sổ khám bệnh hay quên tên thuốc.',
      'Bác sĩ cấp cứu nắm rõ tiền sử chỉ trong 10 giây đầu tiên tiếp nhận.',
      'Tiết kiệm hàng triệu đồng chi phí xét nghiệm lặp lại không cần thiết.',
    ],
    tags: ['Bệnh án điện tử', 'HL7 FHIR', 'Bảo mật HIPAA', 'Hồ sơ y bạ'],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getRelatedPosts(currentSlug: string, limit = 3): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.slug !== currentSlug).slice(0, limit);
}
