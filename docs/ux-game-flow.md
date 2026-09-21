# UX spec — Luồng game "Chiếu Chèo Sương Oan"

- **Trạng thái:** bản nháp v1 để dev triển khai. Không có code trong tài liệu này (chỉ có pseudo-code cho thuật toán chấm điểm và kiểu dữ liệu).
- **Ngày:** 2026-09-22 · **Phạm vi:** luồng game (`/game` và các thẻ), cộng với các phần IA, copy, footer và kho di sản liên quan.
- **Nguồn:** báo cáo audit `2026-09-22-chieu-cheo-suong-oan-uiux-audit.md` (10 route chụp ở 390px và 1440px), đọc trực tiếp `app/_app-shell.tsx`, `app/globals.css`, `app/api/ven/route.ts`, `data/*.ts`, và chạy lại app ở 390px để đo số liệu (header 65.8px, nút menu 24x24, màu `:root` thực tế).
- **Đọc thế nào:** mobile-first (390px). Mỗi màn có mục đích, route, trạng thái, layout 390px (ASCII), ghi chú desktop, copy, và tiêu chí chấp nhận (AC) kiểm chứng được bằng Playwright hoặc DevTools. Mục 10 gom mọi thay đổi thành 4 nhóm: **[CSS]** chỉ sửa style/markup, **[LOGIC]** đổi hành vi, **[COPY]** chỉ sửa chữ, **[CONTENT]** cần nội dung mới từ chủ dự án.
- **Các giả định và câu hỏi mở nằm ở mục 11.** Toàn bộ quyết định "chưa được xác nhận" đều được đánh dấu `[ASSUMPTION]` tại chỗ.

> **Lưu ý cho dev (AGENTS.md):** Next.js ở repo này là 16.3.3, có breaking changes. Các điểm liên quan tới routing đã được đối chiếu với `node_modules/next/dist/docs/01-app/`: `params` trong `page` là **Promise** (phải `await`/`use`), `useSearchParams` cần bọc `<Suspense>` khi trang được prerender, `middleware` đã đổi tên thành `proxy`, redirect tĩnh khai báo bằng `redirects()` trong `next.config.mjs`, layout giữ state khi điều hướng. Trước khi code phần routing (mục 3), đọc lại `03-file-conventions/dynamic-routes.md`, `page.md`, `layout.md` và `04-functions/use-search-params.md`.

---

## 0. Tóm tắt quyết định

| # | Quyết định | Lý do ngắn |
|---|---|---|
| D1 | **Một hệ thống thẻ** với hai bề mặt: `stage` (tối, mặc định, mọi thứ tương tác) và `paper` (giấy kem, **chỉ** dành cho "mặt thẻ" tái hiện nội dung in trên thẻ vật lý: Tích Truyện, Oan, Lời chứng, Can Thiệp). | Ô nhập/nút trên nền kem là nguồn gốc của các lỗi tương phản (gold trên kem chỉ 2.1:1). Giữ kem cho "vật thể" giữ được nhận diện mà không trộn hai ngôn ngữ. |
| D2 | Thang spacing 4-8-12-16-20-24-32-48; thẻ: padding **24 (≤800px) / 32 (>800px)**, gap trong thẻ **16**, khoảng trước cụm nút **24**, giữa thẻ **16 / 24**. | Lấy đúng nhịp của Nhịp–Phách (`padding:32; gap:16`) làm mốc. |
| D3 | Nút: 1 nút chính duy nhất mỗi khối, cao **≥48px**, nhãn **≥14px**; nút phụ viền; liên kết chữ có vùng chạm **≥44px**. | Chạm bằng ngón cái, một tay, cạnh bàn chơi. |
| D4 | Thêm 3 token ngữ nghĩa (success/warning/danger) và **luôn kèm icon + chữ**. | Hiện chỉ có đỏ sơn mài; không phân biệt được "thành công / chưa đủ / lỗi". |
| D5 | **Mỗi màn có một URL.** Thêm `/hoi-dap`, `/tich-truyen[/id]`, `/kiem-chung/[id]`, `/can-thiep`, `/nhip-phach`. Giữ nguyên mọi URL đang chạy. `/game/guide` và `/game/oan` redirect 308 về `/huong-dan` và `/kiem-chung`. | Refresh/Back/QR đều đúng màn. |
| D6 | **Trang được suy ra từ URL** (bỏ state `page` trong AppShell). Nút "← Về..." là `<Link>` tới cha logic; Back của trình duyệt đi theo lịch sử thật. | Nguyên nhân gốc của lỗi Back/refresh là `page` state tách rời URL. |
| D7 | **QR trên thẻ vật lý = URL tuyệt đối, ngắn, không dấu, chứa id thẻ** (Góc Nhìn: `?ma=1842` điền sẵn mã). Không xây máy quét trong app; camera điện thoại là máy quét. | Làm cho copy "Quét thẻ" trở thành thật. Không cần thư viện, không xin quyền camera. |
| D8 | **Vòng đời ván:** Chưa có ván → Ván đang chơi (chương 1–5) → Tổng kết chương → ... → Kết thúc ván → Ván mới. Có nút **Ván mới** (có xác nhận), có **Tổng kết chương**. Session chuyển sang **nhật ký sự kiện** (điểm là giá trị suy ra). | Reset và tổng kết chương gần như miễn phí khi có event log; tránh hai nguồn sự thật. |
| D9 | **Nhịp–Phách:** thêm bước "Nghe mẫu" (hình + tiếng), chấm **từng khoảng giữa các phách** với vùng chấp nhận, **2 lượt thử** + nút Thử lại, và Thẻ Can Thiệp "Giữ nhịp câu chuyện" cộng thêm 1 lượt. Điểm Hiểu Chèo (+1/+2) thực sự được ghi vào session (hiện code chỉ hiện chữ). | Sửa cả 3 lỗi: không có mẫu, không thử lại, chấm sai. |
| D10 | **Sửa copy, không thêm nội dung** (mặc định đã cho): bỏ "25 Góc nhìn", "Quét thẻ Oan" (đến khi QR có thật), "PHIÊN ĐANG LƯU"; chuỗi 5 chương ở Home trỏ tới Hành trình theo chương. | Đúng thực tế: 3 Góc Nhìn, 1 Oan, 2 Tích Truyện, 2 Can Thiệp, 1 mẫu Nhịp–Phách. |
| D11 | **Kho di sản: không khôi phục** ở đợt này; sửa lời hứa "kho tri thức" thành "AI Hỏi Đáp Di Sản". Dành sẵn chỗ IA `/di-san` nếu chủ dự án muốn quay lại. | Nội dung 11 hồ sơ là mẫu chung sinh từ template, 8/11 không liên quan Chèo, ảnh dùng lại; AI Hỏi Đáp đã phủ nhu cầu. |
| D12 | **Footer toàn site** + trang Về dự án có mục "Nguồn & ghi nhận". Nội dung ghi công là `[CONTENT TO BE PROVIDED]`, không tự bịa. | Cần cho sản phẩm giáo dục dùng AI. |

---

## 1. Foundation (nền tảng)

### 1.1 Thiết bị, ngữ cảnh, đầu vào
- **Thiết bị chính:** điện thoại, dọc, **390x844** (kiểm tra thêm 360x740 và 430x932). `[ASSUMPTION]` (mặc định trong brief).
- **Ngữ cảnh:** nhóm học sinh THCS/THPT quanh bàn chơi thật; điện thoại đặt cạnh bàn hoặc cầm một tay; ánh sáng phòng học/quán; có thể tắt tiếng. Mỗi lượt xem web là **ngắn** (đọc thẻ, nhập mã, xem lời chứng) rồi quay lại bàn.
- **Đầu vào:** cảm ứng là chính. Phải dùng được bằng bàn phím (desktop, hỗ trợ tiếp cận). **Không phụ thuộc hover.**
- **Ngôn ngữ:** tiếng Việt (`<html lang="vi">` đã đúng).
- **Breakpoint:** `≤800px` = mobile/tablet dọc (dùng đúng ngưỡng CSS hiện có), `>800px` = desktop. Không thêm breakpoint mới.
- **Kỹ thuật:** Next.js 16 App Router, React 19, Tailwind 4, `lucide-react` (đã có). Toàn bộ trạng thái ván ở `localStorage` (`ccts-game-session`); **không có backend cho ván chơi**.

### 1.2 Ràng buộc bắt buộc (từ brief)
Chữ thân **≥16px**; mục tiêu chạm **≥44px**; không phụ thuộc hover; tương phản **WCAG AA** (4.5:1 chữ thường, 3:1 chữ lớn và thành phần giao diện); tôn trọng `prefers-reduced-motion`; giữ nhận diện (chàm / đỏ sơn mài / vàng, Be Vietnam Pro, sân khấu Chèo).

### 1.3 Bối cảnh nội dung hiện có (quyết định phạm vi sửa copy)
| Thứ | Số lượng thực tế | Ghi chú |
|---|---|---|
| Chương | 5 (`lib/chapters.ts`) | Tên có ở `lib/chapters.ts`; `data/chapters.ts` viết "Oan Thai nuôi trẻ" (hoa "Thai"), lệch với `lib/chapters.ts` ("Oan thai nuôi trẻ"). Chọn một nguồn. |
| Thẻ Tích Truyện | 2 (`story-01` thường, `story-02` có Oan), đều Chương 1 | Chương 2–5 **chưa có thẻ nào** trên web. |
| Tình huống Oan | 1 (`oan-01`) | |
| Thẻ Góc Nhìn | 3 (`1842` Bác Độ, `5931` Cô Mận, `7264` Anh Sửu), đều cho `oan-01` | `data/perspectives.ts` là placeholder (`[CONTENT TO BE PROVIDED]`) và **không được dùng**. |
| Thẻ Can Thiệp | 2 (`i-01`, `i-02`) | Nút "Dùng thẻ" hiện chỉ lật cờ, không có hiệu ứng nào. |
| Nhịp–Phách | 1 mẫu (mã `2714`, 5 phách cách 420ms) | Kết quả không ghi vào session; `+1/+2 Hiểu Chèo` chỉ là chữ. |
| AI Vén Màn | phủ cả 5 chương (AI sinh, 30–40s/lần với model lớn) | Hạn mức 2 câu/chương lưu client. |
| Hành trình | 52 ô sinh bằng công thức (`i%7`, `i%5`, `i%11`) | Loại ô không phải dữ liệu bàn chơi thật `[ASSUMPTION]`. |
| Kho di sản | 11 hồ sơ (`arts[]`) trong code chết | Không có đường vào. |

Hệ quả thiết kế: **trạng thái rỗng "chương này chưa có thẻ" là trạng thái hạng nhất, không phải trường hợp lạ**, vì 4/5 chương rơi vào đó.

---

## 2. Hệ thống thẻ và spacing thống nhất

### 2.1 Vấn đề (bằng chứng)
Hai ngôn ngữ trộn trong một luồng: thẻ kem (`.game-panel`, `.story-card`, `.oan-card`, `.code-box`, `.testimony`, `.ven-question`, `.evidence-list`, `.intervention-grid article`) và thẻ tối (Nhịp–Phách, Hành trình). Một quy tắc dùng chung tô kem nhưng không kèm spacing; 9/116 class không có rule; `.game-panel`, `.oan-card` bị định nghĩa 3 lần. Ngoài spacing còn có **lỗi tương phản** do chữ vàng/xám của giao diện tối rơi vào nền kem.

### 2.2 Token màu (giữ nguyên bảng hiện có, giá trị lấy từ `:root` đang thắng)

| Token | Giá trị | Vai trò |
|---|---|---|
| `--background` | `#100e13` | nền trang |
| `--card` | `#1a1519` | nền thẻ `stage` |
| `--foreground` | `#efe5d2` | chữ chính trên tối |
| `--muted-foreground` | `#b4a99b` | chữ phụ trên tối |
| `--accent` / `--gold` | `#b99a62` / `#c5a56b` | eyebrow, viền nhấn, liên kết chữ trên tối |
| `--primary` / `--lacquer` | `#8c3030` / `#8d2e32` | nút chính, eyebrow trên kem |
| `--paper` | `#efe3c9` (gradient tới `#e1cfac`) | nền `paper` |
| `--ink` | `#201822` | chữ chính trên kem |
| `--ink-2` (mới, thay `#554c47` rải rác) | `#554c47` | chữ phụ trên kem |
| `--indigo` | `#171d3b` | nền bảng Hành trình, header |
| `--jade` | `#6f9b83` | nhấn "chương" |

**Token mới (cộng thêm, không đổi token cũ):**

| Token | Giá trị | Dùng cho | Tương phản |
|---|---|---|---|
| `--ok-text` / `--ok-line` | `#8fd0a8` / `#6f9b83` | thành công trên tối | 10.7:1 trên `--background` |
| `--warn-text` / `--warn-line` | `#e0b45c` / `#b8892f` | "chưa đủ / chưa giúp / cảnh báo" trên tối | 9.9:1 |
| `--danger-text` / `--danger-line` | `#ff9a9a` / `#c0504f` | lỗi trên tối | 9.5:1 |
| `--ok-on-paper` / `--warn-on-paper` / `--danger-on-paper` | `#2f6b4f` / `#7a5210` / `#8d2e32` | trạng thái trên kem | 4.95 / 5.4 / 6.4 |

### 2.3 Bảng tương phản (đã tính)

| Cặp | Tỉ lệ | Kết luận |
|---|---|---|
| `--foreground` trên `--background` | 15.4 | OK |
| `--muted-foreground` trên `--background` | 8.3 | OK |
| `--accent` trên `--background` / trên `--card` | 7.2 / 6.75 | OK |
| chữ `#efe5d2` trên nút `--primary` `#8c3030` | 6.5 | OK |
| `--ink` trên `--paper` / `#e1cfac` | 13.6 / 11.3 | OK |
| `--ink-2` trên `--paper` / `#e1cfac` | 6.6 / 5.5 | OK |
| `--lacquer` trên `--paper` / `#e1cfac` | 6.4 / 5.3 | OK (dùng cho eyebrow, nhãn trong thẻ kem) |
| **`--accent` (vàng) trên `--paper`** | **2.1** | **KHÔNG DÙNG** (hiện đang dùng ở eyebrow, "1 LƯỢT", lời chứng) |
| **`--muted-foreground` trên `--paper`** | **1.8** | **KHÔNG DÙNG** (hiện: bộ đếm `0/300`, placeholder) |
| vàng `#b99a62` chữ trên nút `#8c3030` | 3.05 | chỉ cho chữ lớn ≥18.66px đậm; **không** cho nhãn nút |
| viền ô nhập `--border` (`#b99a624d` ≈ 1.9:1) | < 3 | **KHÔNG ĐỦ** cho ranh giới ô nhập (WCAG 1.4.11). Ô nhập dùng viền đặc `--accent` (7.2:1). |

Quy tắc rút ra: **trên `paper` chỉ dùng `--ink`, `--ink-2`, `--lacquer` và các token `*-on-paper`; không bao giờ dùng `--accent` hay `--muted-foreground`.**

### 2.4 Thang spacing

`--sp-1..8` = **4, 8, 12, 16, 20, 24, 32, 48** px. Mọi margin/padding/gap trong luồng game phải nằm trên thang này.

| Vị trí | Mobile (≤800) | Desktop (>800) |
|---|---|---|
| Lề trang trái/phải | `6vw` hiện có (23px ở 390), **tối thiểu 20px** | `5vw` hiện có |
| Từ header tới eyebrow | 32 | 48 |
| eyebrow → tiêu đề h1 | 12 | 16 |
| h1 → đoạn dẫn (`.lead`) | 16 | 16 |
| Khối tiêu đề trang → thẻ đầu tiên | 32 | 40 |
| **Padding thẻ** | **24** | **32** |
| **Gap dọc giữa phần tử trong thẻ** | **16** (`display:flex; flex-direction:column; gap:16px`) | 16 |
| eyebrow → tiêu đề thẻ | 8 | 8 |
| tiêu đề thẻ → thân | 12 | 12 |
| thân → cụm nút (khoảng cách nút chính với văn bản) | **24** (≥20) | 24 |
| nút chính ↔ nút phụ (xếp dọc) | 12 | 12 |
| **Giữa hai thẻ / hai khối** | **16** | **24** |
| Thẻ cuối → footer | 48 | 64 |
| Lưới thẻ (`.game-grid`, `.about-grid`, `.feature-grid`, Can Thiệp) | **1 cột**, gap 16 | 2 cột, gap 24 |
| Giữa hai mục tiêu chạm liền kề | ≥ 8 | ≥ 8 |

Đề xuất triển khai: định nghĩa các mốc này thành biến (`--card-pad`, `--card-gap`, `--card-stack`) ở đầu khối CSS mới; `--card-pad:24px` và bị ghi đè `32px` trong `@media (min-width:801px)`. `[CSS]`

### 2.5 Cấu trúc một thẻ (anatomy)

```
┌──────────────────────────────────────┐ padding 24
│ EYEBROW (12px, hoa, tracking .14em)  │ + meta bên phải (chip, tuỳ chọn)
│  gap 8                               │
│ Tiêu đề thẻ (h2, 24/30 mobile)       │
│  gap 12                              │
│ Thân (16/26; thẻ kem đọc 18/28)      │
│  gap 16 giữa các đoạn                │
│ Hàng chi tiết (dl): nhãn 12px hoa    │
│   trên giá trị 16px; mỗi mục 1 dòng, │
│   khoảng 12 giữa các mục             │
│  gap 24                              │
│ [ Nút chính — full width mobile ]    │
│  gap 12                              │
│ [ Nút phụ  — full width mobile ]     │
└──────────────────────────────────────┘
```

- Khối thẻ dùng **một** cấu trúc DOM/class thống nhất (`.card` + modifier `--stage|--paper`), thay thế các class rời rạc. Tên class cụ thể do dev quyết định; yêu cầu là **một** rule chứa padding/gap/viền cho mọi thẻ game và xóa các bản định nghĩa trùng của chính các class đó. `[CSS]`
- Eyebrow **không mang thông tin thiết yếu** (chỉ là nhãn phụ), vì ở cỡ 12px. Thông tin thiết yếu (chương, số lượt, trạng thái) đặt ở chip/dòng cỡ ≥14px.
- Góc: `border-radius:2px` (như hiện tại); viền khung trang trí bên trong (`::after inset:10px`) chỉ dùng cho `paper` và **phải có `pointer-events:none` và không đè lên chữ** (thẻ cần padding ≥ 24 để chừa chỗ).
- Hover: `@media (hover:hover)` mới được nâng thẻ (`translateY`); trên cảm ứng không có hiệu ứng "kẹt hover". Không có thông tin nào chỉ xuất hiện khi hover.

### 2.6 Hai bề mặt

| | `stage` (mặc định) | `paper` (mặt thẻ) |
|---|---|---|
| Nền | `--card` `#1a1519`, viền `1px --border` | gradient `--paper` → `#e1cfac`, viền `1px rgba(141,46,50,.5)`, khung trang trí trong |
| Chữ | `--foreground` / `--muted-foreground` | `--ink` / `--ink-2` |
| Eyebrow | `--accent` | `--lacquer` |
| Dùng cho | game hub, hộp nhập mã, hộp câu hỏi, danh sách bằng chứng, kết quả Vén Màn, panel khóa, Nhịp–Phách, Hành trình (bảng + chi tiết), Hướng dẫn, Về dự án, "thẻ trong bộ game" | **Chỉ**: Thẻ Tích Truyện (mặt thẻ), Tình huống Oan (mặt thẻ), Lời chứng (mặt thẻ Góc Nhìn), Thẻ Can Thiệp (mỗi thẻ) |
| Được chứa | mọi thứ | chữ, chip, và **một** nút chính (nền lacquer, chữ sáng: đạt 6.5:1 trên mọi nền). **Không** ô nhập, **không** nút phụ viền, **không** liên kết chữ vàng. |

Quy tắc bổ sung: **tối đa một khối `paper` liền nhau trên một màn** (Can Thiệp là ngoại lệ vì bản chất là hai lá bài); mọi nút phụ nằm ngoài khối kem, ngay dưới nó, trên nền tối. Nhờ vậy ô nhập và nút viền không bao giờ lọt vào nền kem, và Nhịp–Phách (đang tối) đã đúng chuẩn.

`Home` không đổi ngôn ngữ (lá bài `physical-card` là hình vẽ lá bài nên giữ kem); riêng `.feature-card` chuyển sang `stage` để khớp luật trên.

### 2.7 Nút

| Loại | Dùng khi | Style | Kích thước |
|---|---|---|---|
| **Chính** | hành động tiếp theo duy nhất của khối | nền `--primary`, chữ `--primary-foreground`, viền `--accent` 1px | cao **≥48**, ngang 100% mobile, `auto` desktop (min 200); nhãn 14px, đậm, hoa, tracking .06em |
| **Phụ** | lối đi thay thế | trong suốt, viền `--accent` 1px, chữ `--foreground` | cao ≥48, cùng độ rộng nút chính |
| **Liên kết chữ** | điều hướng nhẹ ("Thẻ AI Vén Màn →") | chữ `--accent`, gạch chân khi focus | vùng chạm **≥44** cao (padding dọc), không dựa vào hover |
| **Hủy diệt** (Ván mới, Xóa) | thao tác mất dữ liệu | như nút phụ nhưng chữ `--danger-text`; **luôn qua hộp xác nhận** | ≥48 |
| **Icon** (menu, đóng) | | | ≥44x44, `aria-label` bắt buộc |

- Mỗi khối chỉ có **một** nút chính. Nút phụ và liên kết chữ đứng sau, cách 12.
- Nút hiển thị icon `lucide` **sau** nhãn (như hiện tại); icon chỉ trang trí (`aria-hidden`).
- `:focus-visible`: viền ngoài 2px `--accent` (trên `paper`: `--lacquer`), offset 2px. Không bỏ outline.
- `:active`: đậm hơn 8% và `transform:scale(.98)` (bỏ khi `prefers-reduced-motion`).

### 2.8 Ô nhập và biểu mẫu

- Nhãn **luôn** là `<label for>` gắn với `id` của input (hiện thiếu ở Góc Nhìn và Nhịp–Phách), cỡ 14px hoa, đặt **trên** ô nhập, gap 8.
- Ô nhập số (mã 4 chữ số): cao **56px**, chữ **28px**, `inputMode="numeric"`, `autoComplete="off"`, `enterKeyHint="go"`, `maxLength=4`, giãn chữ `.4em`, **viền đặc 1px `--accent` + viền dưới 2px** (đạt 3:1), nền `--background`, chữ `--foreground`. Chữ cỡ ≥16px để iOS không tự phóng to.
- Gợi ý/trợ giúp: dòng 14px `--muted-foreground` dưới ô ("Mã 4 chữ số in trên thẻ").
- Lỗi: dòng 14–16px, màu `--danger-text` + icon `X`, có `id` liên kết bằng `aria-describedby`, vùng `role="alert"` (chỉ khi lỗi xuất hiện sau hành động, không xuất hiện khi đang gõ).
- Bộ đếm ký tự (Vén Màn): **dưới** ô, căn phải, 14px `--muted-foreground`, **không** đè lên ô.
- Textarea: tối thiểu 4 dòng (`min-height:120px`), chữ 16px, `resize:vertical`.

### 2.9 Trạng thái (bộ tiêu chuẩn cho mọi thành phần)

| Trạng thái | Cách thể hiện (luôn kèm chữ và/hoặc icon, không chỉ màu) | Token |
|---|---|---|
| **default** | như bảng 2.6/2.7 | |
| **focus** | viền ngoài 2px | `--accent` / `--lacquer` (trên kem) |
| **disabled** | mờ 55% và nhãn nói lý do gần đó ("Nhập đủ 4 chữ số", "Chưa chọn đủ 2 bằng chứng"), `aria-disabled` hoặc `disabled` | |
| **loading** | nút đổi nhãn ("AI đang suy nghĩ...") + spinner xoay (tĩnh với reduced-motion), `aria-busy`, vùng nội dung có skeleton | |
| **used / đã dùng** | chip "ĐÃ DÙNG" (nền `--primary`, chữ sáng), dòng "Đã dùng lúc HH:mm · Chương N", nút thay bằng nhãn tĩnh; thẻ **không** làm mờ chữ (giữ tương phản) | |
| **success** | icon `Check`, chữ đậm, viền trái 3px | `--ok-*` |
| **warning / chưa đủ** | icon `TriangleAlert`, viền trái 3px | `--warn-*` |
| **error** | icon `X`, `role="alert"`, viền trái 3px | `--danger-*` |
| **locked / khóa** | icon `LockKeyhole`, tiêu đề nêu lý do, **luôn có lối ra** (đổi chương, về hub) | `--muted-foreground` |
| **empty** | tiêu đề ngắn + 1 câu giải thích + 1 nút chính | |

### 2.10 Kiểu chữ

| Vai trò | Mobile | Desktop | Ghi chú |
|---|---|---|---|
| h1 trang | 36–40px, 1.1, đậm 600 (`clamp(2.25rem, 9vw, 3.5rem)`) | hiện có | Hiện 47px làm tiêu đề vỡ từng từ ở 390px (bắt đầu `Đừng nhận / đáp án ngay.`). |
| h2 thẻ | 24/30 | 28/34 | |
| Thân | **16/26** | 16/26 | Mặt thẻ kem (đọc truyện): **18/28**. |
| Nhãn nút, nhãn ô nhập, chip, dòng "chi tiết" | **14** | 14 | |
| Eyebrow, meta | 12 (chỉ thông tin phụ) | 12 | Ngưỡng tối thiểu tuyệt đối là **12px**; hiện có 10px (`.card-top span`) và 11px (`.game-stats span`), phải nâng lên 12. |
| Số điểm | 28–32 | 32–40 | |

### 2.11 Chuyển động, âm thanh, cảm ứng
- Mọi animation gói trong `@media (prefers-reduced-motion:no-preference)`; với reduced-motion giữ **thay đổi trạng thái tức thời** (đổi màu/viền, không dịch chuyển/phóng to/rung). Nhịp–Phách vẫn phải truyền đạt nhịp: dùng đổi màu/viền theo thời gian (không phải chuyển động).
- Không dùng animation quá 1 lần lặp trên nút chính (hiện `painted-sheen` lặp vô hạn ở `.clapper`: dừng khi reduced-motion, và cân nhắc bỏ vòng lặp trên mobile để tiết kiệm pin).
- Vùng chạm: `touch-action:manipulation` trên mọi nút để tránh trễ và phóng to khi chạm đúp.
- Phản hồi cảm ứng: `navigator.vibrate?.(15)` cho phách/nhấn xác nhận (không có trên iOS, chỉ là phụ; không phụ thuộc).

### 2.12 Hộp thoại xác nhận (dùng cho Ván mới, Dùng Thẻ Can Thiệp)
- `<dialog>` hoặc `role="dialog" aria-modal="true"`; **tiêu đề** nêu hành động ("Bắt đầu ván mới?"), **thân** nêu hậu quả bằng danh từ cụ thể, hai nút xếp dọc trên mobile: **"Giữ lại"** (nút chính, focus mặc định) và **"Xóa và bắt đầu lại"** (hủy diệt). Esc đóng; focus trả về nút đã mở; cuộn nền bị khóa.

---

## 3. Kiến trúc thông tin và routing

### 3.1 Điều hướng chính (header)

4 mục, đã có trong AppShell, đổi tên mục thứ 3 cho ngắn và rõ:

| Nhãn | Route | Ghi chú |
|---|---|---|
| Trang chủ | `/` | |
| AI Hỏi Đáp | `/hoi-dap` | hiện không có URL |
| **Trò chơi** (thay "Chiếu Chèo Sương Oan", trùng logo) | `/game` | active với mọi route thuộc luồng game |
| Về dự án | `/gioi-thieu` | |

- Trạng thái active bằng `aria-current="page"`, tính theo tiền tố route ("Trò chơi" active cho `/game`, `/tich-truyen`, `/kiem-chung`, `/goc-nhin`, `/can-thiep`, `/nhip-phach`, `/ai-ven-man`, `/hanh-trinh`, `/huong-dan`).
- Menu mobile (đang hỏng, xem audit #1): nút hamburger ≥44x44 có `aria-label` "Mở menu"/"Đóng menu", `aria-expanded`, `aria-controls`; panel hiện dưới header (header cao ~66px), 4 mục cao ≥48, Esc và chọn mục đều đóng, đổi icon Menu ↔ X. Đang được sửa ở luồng quick-dev riêng; spec chỉ nêu tiêu chí chấp nhận ở mục 10.
- `<a>` bỏ qua điều hướng ("Bỏ qua điều hướng", trỏ `#main`) là phần tử tab đầu tiên.
- Các trang trong luồng game **không** được đưa vào header: chúng thuộc "Trò chơi" và có điều hướng cục bộ (mục 5.1: hub liên kết mọi thẻ, Hướng dẫn, Hành trình).

### 3.2 Bản đồ route

Giữ **tên route tiếng Việt, phẳng, không dấu** (đã có: `/kiem-chung`, `/goc-nhin`, `/ai-ven-man`, `/hanh-trinh`, `/huong-dan`, `/gioi-thieu`). Lý do giữ phẳng: URL trong mã QR càng ngắn thì mã QR càng thưa và dễ quét trên thẻ nhỏ.

| Route | Màn | Trạng thái hiện tại | Hành động |
|---|---|---|---|
| `/` | Home | có | giữ |
| `/hoi-dap` | AI Hỏi Đáp | **không có URL** | **thêm** |
| `/game` | Game hub | có | giữ |
| `/tich-truyen` | Thẻ Tích Truyện hiện tại của ván (alias, `replace` sang `/tich-truyen/[id]`) | không có URL | **thêm** |
| `/tich-truyen/[id]` (`story-01`, `story-02`) | Một Thẻ Tích Truyện | không có URL | **thêm** (QR dẫn tới đây) |
| `/kiem-chung` | Tình huống Oan hiện tại (alias tới `/kiem-chung/[id]`) | có | giữ, làm alias |
| `/kiem-chung/[id]` (`oan-01`) | Tình huống Oan | chưa có | **thêm** (QR) |
| `/goc-nhin` | Góc Nhìn (nhập mã), nhận `?ma=####` | có | giữ, thêm `?ma` |
| `/can-thiep` | Thẻ Can Thiệp, nhận `?the=i-01` để cuộn tới/nhấn mạnh thẻ | không có URL | **thêm** |
| `/nhip-phach` | Nhịp–Phách, nhận `?ma=2714` | không có URL | **thêm** |
| `/ai-ven-man` | AI Vén Màn, nhận `?chuong=N` | có | giữ, thêm `?chuong` |
| `/hanh-trinh` | Hành trình, nhận `?chuong=N&o=M` | có | giữ, thêm tham số |
| `/game/tong-ket` | Tổng kết chương / kết thúc ván | chưa có | **thêm** (mục 4) |
| `/huong-dan` | Hướng dẫn (**bản chính**) | có, trùng | giữ |
| `/game/guide` | Hướng dẫn | có, trùng | **redirect 308 → `/huong-dan`** |
| `/game/oan` | Kiểm chứng Oan | có, trùng với `/kiem-chung` | **redirect 308 → `/kiem-chung`** |
| `/gioi-thieu` | Về dự án | có | giữ |
| `/di-san`, `/di-san/[slug]` | (dành sẵn) Kho di sản | không | **không làm** ở đợt này (mục 8) |

`redirects()` trong `next.config.mjs` (tài liệu: `05-config/01-next-config-js/redirects.md`): "Redirects are checked before the filesystem", nên có thể giữ hoặc xóa `app/game/guide/page.tsx` và `app/game/oan/page.tsx` sau khi thêm redirect. `[LOGIC]`

Lý do chọn `/huong-dan` làm bản chính: ngắn hơn cho in trên hộp; `/kiem-chung` làm bản chính của Oan: đã được các route khác dùng.

### 3.3 Nguyên nhân gốc và cách sửa

`AppShell` giữ `page` bằng `useState(initialPage)`; `go()` gọi `setPage` và `router.push` chỉ cho 8/12 view; **không có lắng nghe URL**, nên Back đổi URL mà không đổi màn, và 4 view (`qa`, `story`, `intervention`, `rhythm`) không có đường dẫn.

Yêu cầu (`[LOGIC]`):
1. **URL là nguồn sự thật duy nhất.** Màn hình suy ra từ `usePathname()`; bỏ `useState(page)`. `go(page)` → `router.push(pathFor(page))` cho **mọi** view.
2. Mỗi route là một `page.tsx` mỏng (như hiện nay) hoặc một `[id]/page.tsx` dùng `params: Promise<{...}>` và `await`; id không tồn tại gọi `notFound()` (kèm `not-found.tsx` có tiếng Việt: "Không tìm thấy thẻ" + ô nhập mã + về hub).
3. Đưa header/footer và **Provider của session** lên một layout dùng chung (nhóm route hoặc layout gốc) để state không remount giữa các màn, và session chỉ nạp một lần (tránh nháy "0 / 0 / 0" khi refresh; xem trạng thái loading ở 5.1). Tài liệu: layout "preserve state, remain interactive, and do not rerender".
4. Tham số truy vấn (`?ma`, `?chuong`, `?the`, `?o`) đọc bằng `useSearchParams()` **bọc `<Suspense>`**; khi người dùng gõ/đổi thì cập nhật bằng `window.history.replaceState` (không đẩy thêm mục lịch sử).
5. Metadata theo route: mỗi màn có `title` riêng dạng "Tên màn | Chiếu Chèo Sương Oan"; trang động dùng `generateMetadata` (cũng nhận `params` là Promise).

### 3.4 Hành vi Back

| Quy tắc | Chi tiết |
|---|---|
| **Back của trình duyệt** | Luôn về mục lịch sử liền trước, và màn tương ứng phải đúng (đạt được nhờ URL là nguồn sự thật). Không có trạng thái "lơ lửng". |
| **Nút "← Về ..." trong app** | `<Link>` tới **cha logic** cố định (bảng dưới), **không** `history.back()`. Lý do: người vào từ mã QR không có lịch sử trong app. |
| **Đổi trạng thái con (nhập mã, chọn bằng chứng, gõ phách)** | Không đẩy lịch sử. |
| **Chuyển thẻ (hub → Tích Truyện → Oan → Góc Nhìn)** | `push`. Back hoàn tác từng bước. |
| **Redirect alias** (`/tich-truyen` → `/tich-truyen/story-01`, `/kiem-chung` → `/kiem-chung/oan-01`) | `replace`, không tạo mục lịch sử thừa. |
| **Đang giữa vòng** (Vén Màn đã có bằng chứng; Nhịp–Phách đang gõ) | Vòng Vén Màn được lưu (mục 5.8); rời màn không mất và không tính thêm lượt. Nhịp–Phách đang gõ: rời màn hủy lượt hiện tại, **không tính lượt**. Không dùng hộp `beforeunload`. |
| **Cuộn/focus khi đổi route** | cuộn lên đầu; chuyển focus tới `h1` (`tabIndex=-1`) để trình đọc màn hình đọc đúng màn mới. |

Cha logic của các nút "←":

| Màn | Nút "←" đi tới |
|---|---|
| Tích Truyện | Game hub |
| Oan | Thẻ Tích Truyện (thẻ đang mở) |
| Góc Nhìn | Tình huống Oan |
| Can Thiệp | Game hub (hiện Can Thiệp không có nút Back nào: bổ sung) |
| Nhịp–Phách | Game hub |
| Vén Màn | Game hub (hiện Vén Màn không có nút Back: bổ sung) |
| Hành trình, Hướng dẫn, Tổng kết | Game hub |

### 3.5 Mã QR trên thẻ vật lý (deep link)

Nguyên tắc: **QR = URL tuyệt đối ổn định, gắn với id thẻ, không chứa dữ liệu cá nhân, không chứa trạng thái ván.** Mở được khi chưa có ván nào (mục 4.5 "tham gia giữa chừng").

| Thẻ vật lý | URL trong QR | Hành vi khi quét |
|---|---|---|
| Tích Truyện `story-NN` | `/tich-truyen/story-01` | Hiện đúng thẻ. Nếu chưa có ván: tạo ván ở chương của thẻ. Nếu id không có: màn "không tìm thấy". |
| Oan `oan-NN` | `/kiem-chung/oan-01` | Hiện đúng tình huống. |
| Góc Nhìn | `/goc-nhin?ma=1842` | Điền sẵn mã; **tự xem lời chứng ngay** nếu mã hợp lệ (quét là ý định rõ). Ô mã vẫn hiển thị và sửa được (dự phòng nhập tay). Mở lại cùng mã không tính điểm lần hai. |
| Can Thiệp `i-NN` | `/can-thiep?the=i-01` | Cuộn tới và nhấn mạnh thẻ. **Không** tự dùng thẻ. |
| Nhịp–Phách | `/nhip-phach?ma=2714` | Điền mã và mở thử thách. |
| Vén Màn (mặt sau/mã chương) | `/ai-ven-man?chuong=2` | Nếu chưa có ván: đặt chương. Nếu khác chương đang chơi: banner hỏi "Đổi sang Chương 2?" (không tự đổi). |
| Hành trình (ô trên bàn) | `/hanh-trinh?chuong=2&o=12` | Mở đúng tab chương và chọn ô. |

Ghi chú in ấn (cho người làm thẻ, cần chủ dự án xác nhận): mã QR cho URL ngắn, mức sửa lỗi M, cạnh ô mã ≥ 2cm; in kèm **mã 4 chữ số bằng chữ** dưới QR làm phương án dự phòng (đã có cho Góc Nhìn và Nhịp–Phách). Nếu nhóm quét bằng ứng dụng có trình duyệt nhúng (ví dụ Zalo), `localStorage` có thể tách biệt khỏi trình duyệt chính: màn thẻ **không phụ thuộc** ván, nhưng điểm ghi được sẽ nằm ở bộ nhớ nhúng; xem rủi ro ở mục 11.

Dữ liệu id ổn định (`story-01`, `oan-01`, `i-01`, `p-01`...) hiện đang phân tán giữa code nội tuyến và `data/*.ts` chưa dùng (id khác nhau: `O01` vs `oan-01`, `G01` vs `p-01`). Cần **một** nguồn dữ liệu và **không đổi id sau khi in thẻ**. `[LOGIC]`

### 3.6 Sơ đồ điều hướng

```
Trang chủ ──► Trò chơi (/game) ──► Tích Truyện ──► Oan ──► Góc Nhìn ──► (Lời chứng) ──► Can Thiệp
   │              │  │  │              │ (nếu không Oan)                       ▲
   │              │  │  └─► Nhịp–Phách ◄───────── Can Thiệp (Giữ nhịp) ────────┘
   │              │  └────► AI Vén Màn (theo chương)
   │              ├────────► Hành trình  (?chuong=N)
   │              ├────────► Hướng dẫn
   │              └────────► Tổng kết chương ──► chương kế / Kết thúc ván ──► Ván mới
   ├──► AI Hỏi Đáp (/hoi-dap)
   └──► Về dự án (/gioi-thieu)
Footer (mọi trang): Hướng dẫn · Về dự án · Nguồn & ghi nhận
```

---

## 4. Vòng đời ván chơi

### 4.1 Vấn đề hiện tại
Không có "Ván mới/Reset"; Can Thiệp đã dùng và số lượt Vén Màn (2/chương) lưu mãi; `save()` không có `try/catch` (lỗi ở chế độ riêng tư); Story cố định `story-01` và "Tiếp tục" quay về hub; `session.chapter` chỉ đổi được trong Vén Màn; `rhythm*` trong `GameSession` và `hieu` từ Nhịp–Phách chưa từng được ghi; `oanId` cố định.

### 4.2 Máy trạng thái

```
        ┌──────────┐  Bắt đầu ván (chọn chương)   ┌────────────────────┐
        │ CHƯA CÓ  │ ───────────────────────────► │ ĐANG CHƠI (chương n)│◄─┐
        │  VÁN     │ ◄─────── Ván mới (xác nhận) ─│                    │  │ Sang chương n+1
        └──────────┘                              └─────────┬──────────┘  │
             ▲  ▲ (quét QR khi chưa có ván: tự tạo ván)     │ Kết thúc chương n
             │  └────────────────────────────────────────── ▼             │
             │                                    ┌────────────────────┐   │
             │                                    │ TỔNG KẾT CHƯƠNG n  │───┘ (n<5)
             │                                    └─────────┬──────────┘
             │                                              │ (n=5) Kết thúc ván
             │                                    ┌─────────▼──────────┐
             └────────── Ván mới ──────────────── │   VÁN KẾT THÚC     │
                                                  └────────────────────┘
```

| Sự kiện | Điều kiện | Hiệu ứng lên session | Màn tiếp theo |
|---|---|---|---|
| **Bắt đầu ván** | `Hub` (chưa có ván), hoặc QR khi chưa có ván | tạo session mới, `chapter` = đã chọn (mặc định 1), ghi `startedAt` | Hub (đang chơi) |
| **Chọn/đổi chương** | bất cứ lúc nào, qua chip chương | đặt `chapter`; **không** đổi điểm | giữ nguyên màn |
| **Tiến thẻ Tích Truyện** | nút chính của thẻ | tăng `storyIndex[chapter]`; thẻ Oan dẫn tới Oan | thẻ kế / Oan / hết thẻ (chương chưa có thẻ) |
| **Kết thúc chương** | nút phụ ở Hub, hoặc "Hết thẻ trong chương" | đóng dấu `chapterEndedAt` | Tổng kết chương |
| **Sang chương n+1** | từ Tổng kết | `chapter = n+1`; các bộ đếm **theo chương** (lượt Vén Màn) tự nhiên bắt đầu lại vì khóa theo chương | Hub |
| **Kết thúc ván** | Tổng kết chương 5 | `finished = true` | Tổng kết cả ván |
| **Ván mới / Reset** | Hub ("Quản lý ván"), có hộp xác nhận (2.12) | xóa toàn bộ session và vòng Vén Màn đang dở; tạo mới | Hub (chưa có ván) hoặc Chọn chương |

### 4.3 Mô hình dữ liệu đề xuất (`ccts-game-session`, phiên bản 2)

```ts
type GameSessionV2 = {
  v: 2
  startedAt: number                 // epoch ms
  chapter: 1|2|3|4|5
  finished?: boolean
  storyIndex: Record<number, number>   // chương -> chỉ số thẻ Tích Truyện hiện tại (0-based)
  lastPath: string                  // để nút "Tiếp tục" ở hub quay lại đúng màn
  events: GameEvent[]               // NGUỒN SỰ THẬT DUY NHẤT cho điểm, lượt, thẻ đã dùng
  rhythm: Record<string, { attempts: number; extra: number; best: number; passed: boolean; awarded: 0|1|2 }>  // theo mã thẻ
}
type GameEvent =
  | { t: number; ch: number; type: 'perspective'; oanId: string; cardId: string; effect: -1|0|1 }
  | { t: number; ch: number; type: 'intervention'; id: string }
  | { t: number; ch: number; type: 'ven'; win: boolean }
  | { t: number; ch: number; type: 'rhythm'; code: string; pct: number; awarded: 0|1|2 }
```

- **Điểm là giá trị suy ra:** `oan = Σ effect (perspective)`, `hieu = Σ (ven win) + Σ (rhythm awarded)`; lượt Vén Màn còn lại = `2 − đếm(ven, chương)`; Góc Nhìn đã dùng = tập `(cardId, oanId)`; Can Thiệp đã dùng = tập `id`. Tổng kết chương chỉ là lọc `events` theo `ch`.
- `lastPath` chỉ lưu đường dẫn nội bộ đã kiểm tra là tiền tố hợp lệ (tránh open redirect từ dữ liệu bị sửa tay).
- **Phiên bản 1** (không có `v`; có `usedPerspectives`, `oan`, `hieu`...): **bỏ và tạo ván mới** `[ASSUMPTION]` (prototype, chưa có người dùng thật). Nếu cần giữ: chuyển `oan`/`hieu` thành một sự kiện `legacy`.
- Mọi `localStorage.getItem/setItem` bọc `try/catch`; khi lỗi (chế độ riêng tư, đầy bộ nhớ): app **vẫn chạy trong bộ nhớ** và hiện dải thông báo "Không lưu được ván trên máy này. Ván sẽ mất khi tải lại trang." (warning, không chặn).
- Phiên Vén Màn đang dở lưu ở `sessionStorage` (`ccts-ven-round`), không đưa vào `events` cho tới khi trả về `verdict:'ok'`.
- **Không có đồng bộ giữa các máy** (không có backend): mỗi điện thoại trong nhóm có một ván riêng. Vì vậy nhãn điểm ở hub ghi "Sổ điểm trên máy này". `[ASSUMPTION]`, xem câu hỏi mở Q3.

### 4.4 Màn "Chọn chương / Bắt đầu ván" (trạng thái trống của Hub)
Xem 5.1. Có hai lối: (a) "Bắt đầu ván mới" → chọn chương bắt đầu (mặc định Chương 1; danh sách 5 chương, mỗi dòng cao ≥56) → "Bắt đầu"; (b) người có thẻ trên tay quét QR hoặc nhập mã, ván tự tạo (4.5).

### 4.5 Tham gia giữa chừng (QR khi chưa có ván)
Quét bất kỳ thẻ nào mà chưa có ván: tạo ván tự động, `chapter` = chương của thẻ (Tích Truyện/Oan biết chương; Góc Nhìn → chương của Oan; các thẻ còn lại → 1), hiện toast "Đã bắt đầu ván mới ở Chương N. Bạn có thể đổi chương ở game hub." Không hiện hộp thoại chặn.

### 4.6 Tổng kết chương (`/game/tong-ket`)
Xem 5.11.

### 4.7 Reset
- Vị trí: Hub, mục "Quản lý ván" cuối trang, nút phụ hủy diệt **"Ván mới"** (không đặt ở header, tránh chạm nhầm).
- Hộp xác nhận (2.12): tiêu đề "Bắt đầu ván mới?"; thân "Điểm Oan, điểm Hiểu Chèo, các lượt AI Vén Màn, Thẻ Can Thiệp đã dùng và kết quả Nhịp–Phách của ván này sẽ bị xóa khỏi máy này. Việc này không hoàn tác được."; nút **"Giữ ván này"** (focus) / **"Xóa và bắt đầu lại"**.
- Sau reset: toast 4s "Đã xóa ván. Bắt đầu ván mới." (`role="status"`).
- **Rủi ro chi phí AI:** vì hạn mức Vén Màn là ở client, reset (hoặc xóa dữ liệu trình duyệt) khôi phục 2 lượt/chương. Khuyến nghị (ngoài phạm vi UX, ghi để backlog): giới hạn tốc độ theo IP ở `/api/ven`. Xem Q9.

---

## 5. Từng màn

Quy ước AC: `AC-<màn>-n`. "Mobile" = 390x844. Mọi AC về spacing dùng thang 2.4. Mọi màn còn phải qua bộ AC chung ở mục 10.4.

### 5.1 Game hub — `/game`

**Mục đích:** bàn điều khiển của nhóm: đang ở đâu (chương), điểm, việc kế tiếp, và cổng vào **mọi** loại thẻ. Hiện chỉ có 2 panel và một khối chữ; Nhịp–Phách, Vén Màn, Hành trình và Hướng dẫn **không có liên kết** từ hub (đã kiểm tra: `go('guide')` không được gọi ở đâu, `go('rhythm')` chỉ từ Home).

**Trạng thái**
| Trạng thái | Thể hiện |
|---|---|
| **Loading** (chờ đọc `localStorage`) | skeleton cho khối điểm và danh sách thẻ; **không** hiện `0 / 0 / 0` rồi nháy. `aria-busy`. |
| **Chưa có ván** | Thẻ `stage` "Bắt đầu ván mới" + chọn chương (4.4); dưới: liên kết "Đọc hướng dẫn"; dòng "Có thẻ trong tay? Quét QR trên thẻ hoặc nhập mã." |
| **Đang chơi** | thanh ván + điểm + "Tiếp tục" + danh sách bộ thẻ + quản lý ván |
| **Chương chưa có thẻ trên web** (Chương 2–5) | thẻ thông báo (info): "Chương này chưa có thẻ trên web. Hãy dùng bộ thẻ vật lý; AI Vén Màn vẫn dùng được cho chương này." |
| **Ván kết thúc** | thẻ "Ván đã kết thúc" + nút "Xem tổng kết" + "Ván mới" |

**Layout 390px (đang chơi)**
```
[header sticky 66px]
 32
 eyebrow  CHIẾU CHÈO SƯƠNG OAN · TRÒ CHƠI
 12
 h1       Một câu chuyện
          nhiều góc nhìn.                (≤40px)
 16
 lead     Website không thay thế bàn chơi...
 32
┌ stage ───────────────────────────────┐  padding 24
│ VÁN ĐANG CHƠI · Bắt đầu 20:14        │
│ Chương 2 · Rời làng vướng oan   [Đổi]│  chip chương ≥44px cao
│                                      │
│ ĐIỂM OAN   HIỂU CHÈO   LỜI CHỨNG     │  3 cột, số 28px, nhãn 12px
│   -1          0           1          │
│ Sổ điểm trên máy này · Oan càng thấp │  14px muted
│ càng tốt                             │
│ [ TIẾP TỤC · Thẻ Tích Truyện 2 →   ] │  nút chính (lastPath)
└──────────────────────────────────────┘
 16
┌ stage ───────────────────────────────┐
│ BỘ THẺ                               │
│ ▸ Thẻ Tích Truyện     Người Kể Tích  │  mỗi dòng cao ≥64, cả dòng là link
│   Thẻ 2/2 · có Oan                   │
│ ▸ Thẻ Góc Nhìn      Người Soi Chứng  │
│   Đã mở 1/3                          │
│ ▸ Thẻ Can Thiệp            Cả nhóm   │
│   Còn 2/2 thẻ                        │
│ ▸ Thẻ Nhịp–Phách           Cả nhóm   │
│   Chưa thử                           │
│ ▸ Thẻ AI Vén Màn           Cả nhóm   │
│   Chương 2 · còn 2/2 câu             │
└──────────────────────────────────────┘
 16
┌ stage ───────────────────────────────┐
│ CÔNG CỤ                              │
│ ▸ Hành trình (52 ô)                  │
│ ▸ Hướng dẫn chơi                     │
└──────────────────────────────────────┘
 16
┌ stage ───────────────────────────────┐
│ QUẢN LÝ VÁN                          │
│ [ Kết thúc chương 2 ]  (phụ)         │
│ [ Ván mới ]            (hủy diệt)    │
└──────────────────────────────────────┘
 48
[footer]
```
- Dòng thẻ: mỗi dòng là **một** liên kết cao ≥64px, có hàng phụ trạng thái (14px) lấy từ session. Vai Người Kể Tích/Người Soi Chứng lấy từ chữ hiện có ở hub; các thẻ còn lại "Cả nhóm" `[ASSUMPTION]` (Q5).
- Thanh điểm: `Điểm Oan` hiển thị số âm bằng dấu trừ thật `−1`. Ý nghĩa "Oan thấp là tốt" suy từ logic hiện tại (lời chứng "giúp làm rõ" = −1, "chưa giúp" = +1) `[ASSUMPTION]`, cần xác nhận (Q4).
- Nhãn `LỜI CHỨNG` = số lời chứng đã mở ở **ván này** (không chỉ chương này).
- "Tiếp tục" dùng `lastPath`; nếu chưa có → thẻ Tích Truyện hiện tại của chương; nếu chương chưa có thẻ → nút biến thành "Mở AI Vén Màn".

**Desktop (>800):** cột nội dung tối đa 1080px, lưới 2 cột (24): trái = "Ván đang chơi" (kèm quản lý ván), phải = "Bộ thẻ" và "Công cụ". Danh sách thẻ vẫn là danh sách dòng (không thành lưới ô), để cùng mẫu tương tác với mobile.

**Copy:** "Sổ điểm trên máy này", "Đổi chương", "Tiếp tục", "Quản lý ván", "Kết thúc chương N", "Ván mới". Bỏ khối chữ "THẺ TRONG BỘ GAME · Thẻ Tích Truyện · Thẻ Góc Nhìn...".

**AC**
- AC-HUB-1: ở 390px `getComputedStyle('.game-grid').gridTemplateColumns` chỉ có 1 cột; không có tiêu đề vỡ từng từ (mọi `h2` rộng ≥ 200px).
- AC-HUB-2: hub có liên kết tới đủ 5 loại thẻ + Hành trình + Hướng dẫn; mọi hàng liên kết cao ≥ 64px.
- AC-HUB-3: refresh ở `/game` sau khi có ván **không** nháy giá trị 0 (chụp ở 0ms và 300ms không thấy "0" giả); có skeleton.
- AC-HUB-4: không có phần tử nào chữ < 12px; nhãn điểm 12px.
- AC-HUB-5: bấm "Ván mới" luôn mở hộp xác nhận, focus vào "Giữ ván này"; xác nhận xóa `ccts-game-session` và hub về trạng thái "Chưa có ván".

**Thay đổi:** `[CSS]` khoảng cách/lưới/kiểu; `[LOGIC]` Provider session, trạng thái loading, `lastPath`, chọn chương, reset, dòng thẻ có trạng thái; `[COPY]` như trên.

---

### 5.2 Thẻ Tích Truyện — `/tich-truyen/[id]`

**Mục đích:** hiển thị nội dung thẻ Tích Truyện mà Người Kể Tích đang đọc cho cả nhóm; thẻ có dấu Oan dẫn sang tình huống Oan.

**Trạng thái:** thường; **có Oan** (chip + khối `OAN` + nút mở Oan); loading (skeleton mặt thẻ); **không tìm thấy** (`notFound` → "Không tìm thấy thẻ" + hub + nhập mã); **hết thẻ trong chương** (sau thẻ cuối: nút chính "Kết thúc chương N"); **chương chưa có thẻ** (`/tich-truyen` khi chương 2–5: empty "Chương N chưa có Thẻ Tích Truyện trên web. Dùng thẻ vật lý; bạn có thể mở AI Vén Màn hoặc kết thúc chương.").

**Layout 390px**
```
 [← Về game hub]                              44px cao
 eyebrow  THẺ TÍCH TRUYỆN · CHƯƠNG 1      [Thẻ 1/2]  chip 14px
 32
┌ PAPER ───────────────────────────────┐ padding 24
│ (T) THẺ THƯỜNG                       │ huy hiệu 40x40 + nhãn 14px (lacquer)
│ 16                                   │
│ Tiếng trống đầu làng                 │ h1 30px, ink
│ 12                                   │
│ Một tiếng trống mở hội vang lên...   │ 18/28, ink-2
│ (nếu Oan)                            │
│ ┌ OAN ─────────────────────────────┐ │ khối viền lacquer, 16px, gap 8
│ │ Thẻ này mở hệ thống điều tra     │ │
│ │ Góc Nhìn.                        │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
 24
 [ THẺ TIẾP THEO →  /  MỞ TÌNH HUỐNG OAN → ]   chính, 48px
 12
 [ Thẻ AI Vén Màn ✦ ]                           liên kết chữ ≥44
```
- Huy hiệu `T`/`O` là trang trí (`aria-hidden`), **nghĩa nằm ở nhãn chữ** "THẺ THƯỜNG" / "CÓ TÌNH HUỐNG OAN". Huy hiệu kích thước cố định 40x40, không định vị tuyệt đối (hiện lạc ở góc trên trái).
- Nút chính: thẻ thường → "Thẻ tiếp theo" nếu còn (hiện là "Tiếp tục câu chuyện" quay về hub, gây cảm giác treo); thẻ Oan → "Mở tình huống Oan"; thẻ cuối của chương (không có thẻ sau) → "Kết thúc chương N".
- Chip "Thẻ 1/2" chỉ hiển thị khi biết tổng số thẻ trong chương.

**Desktop:** mặt thẻ giới hạn 720px, căn trái dưới h1; nút chính `auto`.

**AC**
- AC-STORY-1: mặt thẻ có padding-left/right ≥ 24px ở 390px; h1 → đoạn → nút cách nhau ≥ 12/24/24.
- AC-STORY-2: huy hiệu có `width=height=40px`, nằm trong luồng (không `position:absolute` ngoài thẻ).
- AC-STORY-3: `/tich-truyen/khong-co` trả `notFound` (HTTP 404, có link về hub).
- AC-STORY-4: refresh tại `/tich-truyen/story-02` giữ nguyên thẻ; Back từ `/kiem-chung/oan-01` quay về `/tich-truyen/story-02`.
- AC-STORY-5: ở Chương 2 màn `/tich-truyen` hiện empty state, có ≥1 nút chính hoạt động.

**Thay đổi:** `[CSS]` padding/gap/huy hiệu; `[LOGIC]` route, tiến thẻ, thẻ cuối, empty; `[COPY]` nhãn nút.

---

### 5.3 Tình huống Oan — `/kiem-chung/[id]`

**Mục đích:** nhóm đọc tình huống (`oan-01`) rồi chọn nhìn từ góc nào (Góc Nhìn) hoặc dùng Thẻ Can Thiệp.

**Trạng thái:** mặc định; loading; không tìm thấy; **đã mở lời chứng** (danh sách "Lời chứng đã mở (n)" từ session, mỗi dòng là liên kết `/goc-nhin?ma=...`, không tính điểm lại); **đủ lời chứng** (khi đã mở hết 3/3: nút chính "Chọn Thẻ Góc Nhìn" đổi thành thông báo "Đã mở hết Góc Nhìn hiện có" `[CONTENT]`).

**Layout 390px**
```
 [← Về Thẻ Tích Truyện]
 eyebrow  TÌNH HUỐNG OAN · OAN-01
 32
┌ PAPER ───────────────────────────────┐
│ Lời truyền ngoài sân                 │ h1 30px
│ Một lời truyền miệng khiến nhân vật  │ 18/28
│ bị nhìn bằng ánh mắt khác. Hãy đọc   │
│ tình huống trước khi chọn một Thẻ    │
│ Góc Nhìn.                            │
│ ─────────────                        │
│ Bạn muốn nhìn sự việc từ góc nhìn    │ câu hỏi in đậm (ink)
│ của ai?                              │
└──────────────────────────────────────┘
 24
 [ CHỌN THẺ GÓC NHÌN 👁 ]      chính
 12
 [ Xem Thẻ Can Thiệp ]         phụ (trên nền tối, ngoài mặt thẻ)
 32
┌ stage ───────────────────────────────┐
│ LỜI CHỨNG ĐÃ MỞ (1/3)                │
│ ▸ Bác Độ · Người giữ trống làng      │  dòng ≥56, có icon trạng thái
│   Giúp làm rõ một phần               │
└──────────────────────────────────────┘
```
- **Nút phụ ra ngoài mặt thẻ** theo quy tắc 2.6 (hiện nút viền đặt trong khối).

**Desktop:** mặt thẻ 720px; "Lời chứng đã mở" bên phải (2 cột khi ≥1000px).

**AC**
- AC-OAN-1: mặt thẻ padding ≥24 (mobile); khoảng cách câu hỏi → nút ≥ 24.
- AC-OAN-2: `/game/oan` trả 308 về `/kiem-chung`.
- AC-OAN-3: mở 1 lời chứng ở Góc Nhìn rồi quay lại: danh sách hiện đúng 1 dòng, sau refresh vẫn còn.

**Thay đổi:** `[CSS]`; `[LOGIC]` danh sách lời chứng đã mở (đọc `events`), route `[id]`, redirect; `[COPY]` không đổi.

---

### 5.4 Góc Nhìn — `/goc-nhin` (`?ma=####`)

**Mục đích:** Người Soi Chứng nhập mã 4 chữ số trên Thẻ Góc Nhìn để đọc lời chứng của nhân vật (điều họ biết và **không** biết).

**Trạng thái (bổ sung so với hiện tại, ba lỗi được tách riêng)**
| Trạng thái | Điều kiện | Thể hiện |
|---|---|---|
| **Rỗng** | chưa nhập | ô nhập + hướng dẫn "Mã 4 chữ số in trên Thẻ Góc Nhìn"; nút "Xem góc nhìn" disabled + nhãn lý do |
| **Đang nhập** | 1–3 số | **không hiện lỗi** (hiện hiện lỗi từ chữ số đầu tiên); nút vẫn bấm được, bấm thì hiện "Nhập đủ 4 chữ số." |
| **Lỗi: không có thẻ** | 4 số, không khớp thẻ nào | danger: "Không tìm thấy thẻ có mã này. Kiểm tra lại mã trên thẻ." |
| **Lỗi: sai tình huống** | thẻ tồn tại nhưng không thuộc Oan hiện tại | danger: "Thẻ này không thuộc tình huống hiện tại." |
| **Thành công · giúp làm rõ** (`effect −1`) | | success: "Thông tin này giúp làm rõ một phần sự việc." + chip "Điểm Oan −1" |
| **Trung tính · chưa đủ** (`effect 0`) | | warning: "Thông tin này chưa đủ để xác định sự việc." + "Điểm Oan +0" |
| **Cảnh báo · chưa giúp** (`effect +1`) | | warning: "Thông tin này chưa giúp làm rõ tình huống." + "Điểm Oan +1" |
| **Mở lại** (đã mở trước) | trùng `(cardId, oanId)` | hiện lời chứng như bình thường + dòng info "Đã ghi nhận trước đó. Không tính điểm lần nữa." |
| **Deep link `?ma`** | | điền mã, tự xem nếu hợp lệ; nếu không hợp lệ hiện lỗi tương ứng sau khi tải |

Hiện `result ok` (xanh) áp cho cả "chưa giúp làm rõ": sai. Kết quả dùng đúng ngữ nghĩa ở bảng trên (icon `Check` / `TriangleAlert`).

**Layout 390px**
```
 [← Về tình huống Oan]
 eyebrow  NGƯỜI SOI CHỨNG · THẺ GÓC NHÌN
 h1       Mở một
          góc nhìn.
 32
┌ stage ───────────────────────────────┐ padding 24
│ NHẬP MÃ 4 CHỮ SỐ                     │ label 14px
│ 8                                    │
│ ┌──────────────────────────────────┐ │
│ │  1 8 4 2                         │ │ 56px cao, 28px, viền đặc
│ └──────────────────────────────────┘ │
│ 8                                    │
│ Mã in trên Thẻ Góc Nhìn.             │ 14px muted
│ (lỗi: ✕ Nhập đủ 4 chữ số.)           │ danger-text, 16px
│ 24                                   │
│ [ XEM GÓC NHÌN → ]                   │ chính, full width
└──────────────────────────────────────┘
 24  (≥24 giữa code box và lời chứng)
┌ PAPER ───────────────────────────────┐
│ BÁC ĐỘ · NGƯỜI GIỮ TRỐNG LÀNG        │ eyebrow lacquer (KHÔNG vàng)
│ [để ý âm thanh] [nhớ trình tự]       │ chip 14px, gap 8, wrap
│ Lời chứng / Thông tin được biết      │ h2 22px
│ Bác Độ nhớ tiếng trống vang lần đầu..│ 18/28
│ ┌ Giới hạn hiểu biết ──────────────┐ │ khối riêng, 16px (không dùng <small>)
│ │ Không nghe được những lời nói ở  │ │
│ │ cuối sân đình.                   │ │
│ └──────────────────────────────────┘ │
│ ✔ Thông tin này giúp làm rõ một phần │ banner trạng thái (success/warning)
│   sự việc.   ĐIỂM OAN −1             │
└──────────────────────────────────────┘
 24
 [ NHẬP MÃ KHÁC ]  (chính)   [ Xem Thẻ Can Thiệp ] (phụ, nếu đủ điều kiện)   [ Về tình huống Oan ] (liên kết)
```
- Sau khi có lời chứng: cuộn tới và chuyển focus vào tiêu đề lời chứng (`tabIndex=-1`), vùng kết quả `role="status"` (đọc tự động, không cần `role="alert"`).
- "Nhập mã khác" xóa ô nhập, đưa focus về ô nhập, cuộn lên.

**Desktop:** hộp nhập và lời chứng cùng cột 720px (không đặt cạnh nhau, vì lời chứng là kết quả của hộp nhập).

**AC**
- AC-GN-1: gõ 1 chữ số **không** hiện lỗi; bấm nút với 1–3 số hiện "Nhập đủ 4 chữ số."
- AC-GN-2: nhập `1842` → lời chứng Bác Độ; `0000` → "Không tìm thấy thẻ..."; (giả lập) mã có thẻ nhưng sai Oan → "Thẻ này không thuộc...".
- AC-GN-3: `effect +1` (mã `7264`) hiển thị trạng thái cảnh báo (`TriangleAlert`), **không** dùng lớp/màu thành công.
- AC-GN-4: `<label for>` gắn đúng input (`document.querySelector('label').control === input`).
- AC-GN-5: khoảng cách giữa hộp nhập và lời chứng ≥ 24px; mọi chữ trong lời chứng tương phản ≥ 4.5:1 (eyebrow lacquer).
- AC-GN-6: `/goc-nhin?ma=1842` mở thẳng lời chứng; tải lại không tính điểm lần hai (`events` không tăng).
- AC-GN-7: input `height ≥ 56px`, `font-size ≥ 16px`; viền có tương phản ≥ 3:1.

**Thay đổi:** `[CSS]` hộp nhập/lời chứng; `[LOGIC]` tách 3 loại lỗi, xác thực khi bấm, ghi `events`, chống tính điểm trùng, `?ma`, `htmlFor`; `[COPY]` như bảng.

---

### 5.5 Thẻ Can Thiệp — `/can-thiep` (`?the=i-01`)

**Mục đích:** ghi nhận việc nhóm dùng một Thẻ Can Thiệp (mỗi thẻ 1 lượt), và nhắc điều kiện/thời điểm/hiệu ứng. Web là **sổ ghi**: trọng tài là luật bàn chơi vật lý `[ASSUMPTION]` (Q6).

**Trạng thái mỗi thẻ**
| Trạng thái | Thể hiện |
|---|---|
| **Còn lượt · đủ điều kiện** | chip "1 LƯỢT" + chip success "Đủ điều kiện" (tính từ session: `i-01` khi lời chứng gần nhất có `effect ≥ 0`; `i-02` khi Nhịp–Phách lượt 1 chưa đạt và chưa có thẻ này) |
| **Còn lượt · chưa đủ điều kiện** | chip warning "Chưa đủ điều kiện theo ghi nhận trên máy này"; nút **vẫn bấm được** nhưng hộp xác nhận thêm dòng "Điều kiện chưa khớp với ghi nhận trên máy này. Vẫn dùng?" (mềm, vì nhóm có nhiều điện thoại: ghi nhận có thể không đầy đủ) |
| **Đã dùng** | chip "ĐÃ DÙNG", dòng "Đã dùng lúc 20:14 · Chương 1", nút thay bằng nhãn tĩnh; thẻ giữ nguyên độ sáng |
| **Deep link `?the`** | thẻ được cuộn tới và viền lacquer 3px |
| **Thành công khi dùng** | toast + dòng nhắc hiệu ứng: `i-01` "Đã ghi nhận. Hãy thực hiện trên bàn chơi: nhập thêm một mã Góc Nhìn." ; `i-02` "Đã thêm 1 lượt thử Nhịp–Phách." kèm liên kết "Đi tới Nhịp–Phách" |

**Layout 390px** (thẻ xếp dọc, gap 16)
```
 [← Về game hub]
 eyebrow  THẺ CAN THIỆP · NGUỒN LỰC CHIẾN THUẬT
 h1       Nhóm vẫn có
          quyền lựa chọn.
 32
┌ PAPER ───────────────────────────────┐ padding 24
│ THẺ CAN THIỆP              [1 LƯỢT]  │ eyebrow lacquer; chip nền lacquer chữ sáng
│ 8                                    │
│ Xin thêm một lời chứng               │ h2 24px, ink
│ 12                                   │
│ Mở thêm một cơ hội xem Thẻ Góc Nhìn  │ 16/26 ink-2
│ sau kết quả chưa đủ.                 │
│ 16                                   │
│ ĐIỀU KIỆN                            │ nhãn 12px lacquer
│ Sau kết quả chưa đủ hoặc chưa giúp.  │ giá trị 16px ink
│ 12                                   │
│ THỜI ĐIỂM                            │
│ Ngay sau điều tra Góc Nhìn           │
│ 12                                   │
│ HIỆU ỨNG                             │
│ Cho phép nhập thêm một mã Góc Nhìn.  │
│ 24                                   │
│ [ DÙNG THẺ ]                         │ full width, đáy thẻ
└──────────────────────────────────────┘
 16
┌ PAPER (thẻ 2) ───────────────────────┐
```
- Bỏ cụm `<small>` nối liền ("Điều kiện: ... Thời điểm: ... Hiệu ứng: ..." hiện liền một dòng, chữ nhỏ): mỗi mục **một dòng riêng** như trên.
- "Dùng thẻ" luôn mở hộp xác nhận (2.12): "Dùng thẻ 'Xin thêm một lời chứng'? Thẻ chỉ dùng được 1 lần trong ván." / "Để sau" · "Dùng thẻ".

**Desktop:** lưới 2 cột, chiều cao bằng nhau, nút ở đáy mỗi thẻ (`margin-top:auto`).

**AC**
- AC-CT-1: các thẻ cách nhau ≥16px (mobile) / ≥24px (desktop); mỗi mục điều kiện/thời điểm/hiệu ứng nằm trên dòng riêng.
- AC-CT-2: nút "Dùng thẻ" cao ≥48px; bấm mở hộp xác nhận, chỉ sau xác nhận mới thêm sự kiện `intervention`.
- AC-CT-3: thẻ đã dùng có chip "ĐÃ DÙNG" và nút thay bằng chữ; refresh vẫn giữ.
- AC-CT-4: `/can-thiep?the=i-02` cuộn tới thẻ 2 và nhấn mạnh.
- AC-CT-5: dùng `i-02` ở chương có lượt Nhịp–Phách ⇒ số lượt thử tối đa của Nhịp–Phách tăng thêm 1 (mục 6).
- AC-CT-6: chip "1 LƯỢT" trên nền kem có tương phản ≥ 4.5:1 (không dùng vàng).

**Thay đổi:** `[CSS]`; `[LOGIC]` route, xác nhận, điều kiện mềm, ghi `events`, liên kết với Nhịp–Phách; `[COPY]`.

---

### 5.6 AI Vén Màn — `/ai-ven-man` (`?chuong=N`)

**Mục đích:** nhóm đặt câu hỏi về cốt truyện/nghệ thuật Chèo; AI **không** trả lời ngay mà đưa 4 bằng chứng (2 đúng, 2 gây nhiễu); nhóm chọn 2, rồi xem đáp án. Tối đa **2 câu/chương**.

**Trạng thái**
| Trạng thái | Thể hiện |
|---|---|
| **Rỗng (còn lượt)** | chip chương + ô câu hỏi + 3 gợi ý câu hỏi (chip) + "Vén màn" disabled kèm nhãn lý do |
| **Đang gõ** | bộ đếm `n/300` dưới ô, không đè chữ; nút bật khi ≥ 2 ký tự (khớp API: `length < 2` → 400) |
| **Loading** | nhãn nút "AI đang suy nghĩ...", ô khóa, skeleton bằng chứng, `aria-busy`. Do model có thể mất 30–40s: sau 8s hiện dòng "AI cần thêm chút thời gian, xin đừng đóng trang."; sau 45s hiện lỗi "AI phản hồi quá chậm" + "Thử lại". **Không** tính lượt. |
| **Lỗi mạng / 502 / 503** | danger, `role="alert"`, "Không thể kết nối AI lúc này." + nút "Thử lại"; **không** tính lượt |
| **Từ chối (`off_topic`/`inappropriate`)** | warning (không phải lỗi): hiện `message` của AI + "Đặt lại câu hỏi"; **không** tính lượt |
| **Chọn bằng chứng** | 4 nút cao ≥56, `aria-pressed`, đánh dấu `Check` + viền; đếm "(2/2)"; thanh hành động **dính đáy** mobile chứa nút "Xem câu trả lời" (`position:sticky; bottom:0` + `padding-bottom: env(safe-area-inset-bottom)`) |
| **Kết quả** | banner success ("CHỌN ĐÚNG · +1 ĐIỂM HIỂU CHÈO") hoặc **warning trung tính** ("CHƯA ĐÚNG · KHÔNG CÓ ĐIỂM HIỂU CHÈO"; không dùng đỏ, đây là học tập); danh sách 4 bằng chứng gắn nhãn "Bằng chứng đúng / Gây nhiễu · nhóm đã chọn" (chữ + icon, không chỉ màu); câu trả lời (Markdown); dòng "Nội dung do AI tạo, có thể chưa chính xác." |
| **Khóa (hết 2 lượt)** | `LockKeyhole` + "Đã dùng hết lượt hỏi của chương này." + **hai nút**: "Đổi chương" (mở danh sách chương) và "Về game hub" (hiện là ngõ cụt) |
| **Vòng dở dang** | quay lại màn sau khi rời/tải lại: hiện đúng bước chọn bằng chứng (từ `sessionStorage`) với banner "Đang tiếp tục vòng hỏi trước." |

**Thay đổi luật tính lượt (`[LOGIC]`)**: hiện lượt chỉ bị trừ khi bấm "Xem câu trả lời" (`reveal`), nên tải lại trang sau khi đã thấy 4 bằng chứng sẽ bỏ vòng mà **không mất lượt** (lách hạn mức). Đề xuất: **trừ lượt ngay khi server trả `verdict:'ok'`** và lưu vòng dở ở `sessionStorage`. Câu bị từ chối/lỗi vẫn miễn phí.

**Chip chương:** thay danh sách 5 nút chiếm ~360px trước khi thấy ô câu hỏi (ô hỏi rơi xuống dưới màn hình ở 390x844, xem ảnh) bằng **một chip** "Chương 2 · Rời làng vướng oan ▾" (cao ≥48) mở danh sách chương (bottom sheet hoặc thẻ xổ; chọn xong đóng). Khi đang giữa vòng, chip khóa (như `disabled={midRound}` hiện tại) và có nhãn "Kết thúc vòng để đổi chương". Nguồn sự thật của chương là `session.chapter` (đổi được ở hub và ở đây, nhất quán).

**Layout 390px (còn lượt)**
```
 [← Về game hub]
 eyebrow  THẺ AI VÉN MÀN · CHƯƠNG 2 · CÒN 2/2 CÂU
 h1       Đừng nhận
          đáp án ngay.
 16
 [ Chương 2 · Rời làng vướng oan   ▾ ]      48px
 24
 lead   Đặt một câu hỏi về cốt truyện...    16/26
 16
┌ stage ───────────────────────────────┐ padding 24
│ CÂU HỎI CỦA NHÓM                     │
│ ┌──────────────────────────────────┐ │
│ │ (textarea 120px, chữ 16px)       │ │
│ └──────────────────────────────────┘ │
│                            0/300     │ 14px, dưới ô
│ Gợi ý: [Vì sao Thị Kính bị nghi oan?]│ chip cao 44px, wrap
│ 24                                   │
│ [ VÉN MÀN ✦ ]                        │
└──────────────────────────────────────┘
```
Gợi ý lấy từ nội dung sẵn có: "Vì sao Thị Kính bị nghi oan?" (`data/aiExamples.ts`), cộng ≤2 câu do chủ dự án cung cấp `[CONTENT]`.

**Desktop:** cột 720px; bằng chứng xếp lưới 2x2 (24), câu trả lời bên dưới.

**AC**
- AC-VEN-1: `.ven-question` có padding ngang ≥ 20px; bộ đếm không giao với ô nhập (`getBoundingClientRect` của bộ đếm không nằm trong textarea).
- AC-VEN-2: ở 390x844 ô câu hỏi nằm trong màn hình đầu tiên (top ≤ 700px) khi chương đã chọn.
- AC-VEN-3: mô phỏng phản hồi `verdict:'off_topic'` → hiện warning, lượt còn lại **không đổi**; phản hồi `ok` → lượt trừ 1 ngay, tải lại trang không khôi phục lượt.
- AC-VEN-4: khi hết lượt có ≥ 2 lối ra (đổi chương, về hub).
- AC-VEN-5: nút "Xem câu trả lời" luôn nhìn thấy khi đã chọn đủ 2 bằng chứng mà không cần cuộn (sticky).
- AC-VEN-6: kết quả "CHƯA ĐÚNG" không dùng màu/icon lỗi (`X` đỏ).

**Thay đổi:** `[CSS]` khoảng cách, `.ven-question`, chip chương, sticky bar; `[LOGIC]` luật tính lượt, lưu vòng dở, timeout/thử lại, gợi ý; `[COPY]` nhãn khóa, disclaimer AI.

---

### 5.7 AI Hỏi Đáp — `/hoi-dap`

**Mục đích:** hỏi đáp tự do về nghệ thuật truyền thống Việt Nam (RAG), ngoài luồng game. **Chỉ nêu phần cần cho luồng:** đã ổn về bố cục (empty state có gợi ý).

- **Route:** `/hoi-dap` (mới); nhãn menu "AI Hỏi Đáp" active.
- **Trạng thái:** rỗng (gợi ý), đang gõ, loading (dấu chấm gõ + nhãn "AI đang tìm nguồn..."), lỗi mạng ("Không thể kết nối AI lúc này." + Thử lại), có nguồn (liên kết mở tab mới, `rel="noreferrer"`, có `<span class="sr-only">(mở tab mới)</span>`).
- **Mobile:** thanh nhập dính đáy, cao ≥56, `padding-bottom: env(safe-area-inset-bottom)`, chữ 16px; nút gửi 48x48; **Enter xuống dòng** trên thiết bị cảm ứng (`(pointer:coarse)`), Enter gửi trên desktop (Shift+Enter xuống dòng). Nội dung chat giữ khi rời màn trong cùng phiên (`sessionStorage`); có nút "Cuộc hỏi mới".
- **Disclaimer** dưới ô nhập: "Câu trả lời do AI tạo, có thể chưa chính xác. Hãy đối chiếu nguồn."
- **AC:** AC-QA-1 `/hoi-dap` tải trực tiếp và refresh đúng màn; AC-QA-2 ô nhập chữ ≥16px (iOS không phóng to), nút gửi ≥44x44; AC-QA-3 Back từ `/hoi-dap` về trang trước, không rời app sang trang khác.
- **Thay đổi:** `[LOGIC]` route; `[CSS]` thanh nhập; `[COPY]` disclaimer.

---

### 5.8 Nhịp–Phách — `/nhip-phach` (`?ma=2714`)

Đặc tả đầy đủ ở **mục 6**. Tóm tắt màn: nhập mã → **Nghe mẫu** → gõ theo → **kết quả từng phách** → **Thử lại** hoặc **Dùng Thẻ Can Thiệp**. Layout 390px dùng đúng nhịp Nhịp–Phách hiện tại (`padding 32→24`, `gap 16`) làm chuẩn cho các màn khác.

---

### 5.9 Hành trình — `/hanh-trinh` (`?chuong=N&o=M`)

**Mục đích (đề xuất lại):** **bản đồ tham khảo** của bàn chơi 52 ô, 5 chương: xem ô đó là loại gì và có thể mở thẻ nào. **Không** theo dõi vị trí quân cờ (quân cờ nằm trên bàn thật) `[ASSUMPTION]` (Q7); vì vậy bỏ "PHIÊN ĐANG LƯU" và "ĐANG ĐỨNG Ở Ô".

**Vấn đề đã đo:** lưới rộng ~459px trong khung 390px (tràn ngang 69px); sửa "8 cột" thuần CSS cho ô ~36px (không đạt 44px).

**Bố cục mobile đề xuất: tab theo chương** (thay vì nhồi 52 ô)
```
 [← Về game hub]
 eyebrow  BẢN ĐỒ HÀNH TRÌNH · 52 Ô · 5 CHƯƠNG
 h1       Đường đi không
          thẳng.
 lead     Mỗi ô là một lần dừng lại...
 32
 [ C1 ][ C2 ][ C3 ][ C4 ][ C5 ]        segmented control, mỗi nút 60x48, gap 6
 12
 Chương 2 · Rời làng vướng oan          h2 22px
 Ô 12–22                                14px muted
 16
┌ stage ───────────────────────────────┐ padding 12, gap 8
│ [12][13][14][15]                     │ lưới 4 cột: ô ~ 72x72
│ [16][17][18][19]                     │ (≥44 ở mọi thiết bị ≥ 360px)
│ [20][21][22]                         │
└──────────────────────────────────────┘
 8
 Chú giải:  C1 chốt chương · ? bằng chứng · × lựa chọn · · cảnh kể   (14px, wrap)
 16
┌ stage ───────────────────────────────┐  chi tiết ô đang chọn (cùng bề rộng lưới)
│ Ô 12 · CHƯƠNG 2                      │
│ Một bằng chứng chưa đủ.              │
│ Bằng chứng không tự nói ra đáp án... │
│ 24                                   │
│ [ MỞ GÓC NHÌN → ]                    │
└──────────────────────────────────────┘
```
- Tab: `role="tablist"`, mũi tên trái/phải chuyển tab; tab đang chọn `aria-selected`; số ô mỗi chương: 11, 11, 11, 11, 8 (chương 5: ô 45–52).
- Ô: `aria-label="Ô 12, chương 2, bằng chứng"` (thêm **loại** ô; hiện chỉ có số + chương). Ô nội dung ≥44x44 và cách nhau ≥ 8px.
- **Chú giải** hiển thị (hiện các ký hiệu `?`, `×`, `·`, `C1` không được giải thích ở đâu).
- Nút trong khối chi tiết chỉ hiển thị **khi ô có đích thật**: bằng chứng (`?`) → Góc Nhìn; lựa chọn (`×`) → Thẻ Can Thiệp; chốt chương → "AI Vén Màn chương N"; ô thường/mở/giác → **không có nút** (thay cho "Tiếp tục" hiện tại trỏ về hub một cách vô nghĩa) `[ASSUMPTION]` (Q7).
- **Phương án tạm (chỉ CSS)** nếu chưa làm tab: `repeat(6,minmax(0,1fr))`, gap 4, padding 12 ⇒ ô ≈ 50px, hàng thứ 9 còn 4 ô; **không** dùng 8 cột (ô ~36px). Khối chi tiết luôn nằm trong lề trang (không `position:sticky` ở mobile).

**Desktop (>800):** giữ bảng 11 cột (52 ô, gap 7) + khối chi tiết sticky 290px bên phải như hiện tại, thêm dải màu theo chương và chú giải phía dưới bảng.

**Trạng thái:** loading không cần (dữ liệu tĩnh); ô chưa có đích: không có nút; `?o` vượt biên (0 hoặc >52) → bỏ qua, chọn ô 1.

**AC**
- AC-HT-1: ở 390px `scrollWidth ≤ innerWidth`; không phần tử nào có `right > innerWidth`.
- AC-HT-2: mọi ô ≥ 44x44px, khoảng cách ≥ 8px (hoặc lưới 6 cột nếu dùng phương án tạm, ô ≥ 44px).
- AC-HT-3: có chú giải nhìn thấy; mỗi `aria-label` ô chứa loại ô.
- AC-HT-4: `/hanh-trinh?chuong=3&o=25` mở tab Chương 3 và chọn ô 25.
- AC-HT-5: không còn chuỗi "PHIÊN ĐANG LƯU" hoặc "ĐANG ĐỨNG".
- AC-HT-6: nút "Tiếp tục" trỏ về hub không còn xuất hiện.

**Thay đổi:** `[CSS]` (phương án tạm) hoặc `[CSS]+[LOGIC]` (tab chương, tham số); `[COPY]`; `[CONTENT]` xác nhận loại ô.

---

### 5.10 Hướng dẫn — `/huong-dan`

**Mục đích:** giải thích cách chơi bằng 4 bước, ngắn để đọc lúc đang đứng ở bàn.
- **Route:** một URL chính `/huong-dan`, `/game/guide` → 308.
- **Khả năng tiếp cận:** hiện không có liên kết vào trang này (không có `go('guide')`); thêm vào hub ("Công cụ") và footer.
- **Layout 390px:** 4 thẻ `stage` xếp dọc, gap 16; mỗi thẻ: số bước (eyebrow), tiêu đề, thân 16px; nút cuối "Mở game hub" (chính). Số bước không tự tạo ngõ cụt: mỗi bước có liên kết ngữ cảnh ("Mở Thẻ Tích Truyện" ở bước 2, "Nhập mã Góc Nhìn" ở bước 3).
- **Copy sửa (mục 7):** bước 3 "Quét hoặc nhập mã" sửa thành "Quét mã QR trên thẻ bằng camera điện thoại, hoặc nhập mã 4 chữ số" **chỉ khi** QR đã có (D7); trước đó ghi "Nhập mã 4 chữ số trên thẻ".
- **AC:** AC-GD-1 `/game/guide` chuyển 308 tới `/huong-dan`; AC-GD-2 hub và footer có liên kết; AC-GD-3 4 thẻ cách nhau ≥16px, padding ≥24 (mobile).
- **Thay đổi:** `[CSS]`, `[COPY]`, `[LOGIC]` redirect.

### 5.11 Tổng kết chương — `/game/tong-ket` (mới)

**Mục đích:** khép một chương, khuyến khích nhóm suy ngẫm, rồi sang chương kế hoặc kết thúc ván.

```
 eyebrow  TỔNG KẾT · CHƯƠNG 1
 h1       Làng quê khởi sự
 32
┌ stage ───────────────────────────────┐
│ CÂU HỎI CHO CẢ NHÓM                  │ eyebrow
│ Nhận ra một câu chuyện luôn có       │ mục tiêu chương (data/chapters.ts.objective),
│ nhiều người chứng kiến.              │ chuyển thành câu hỏi 18px
│ 16                                   │
│ Nhóm đã nhận ra điều này chưa?       │
└──────────────────────────────────────┘
 16
┌ stage ───────────────────────────────┐
│ TRONG CHƯƠNG NÀY                     │
│ Điểm Oan         −1                  │
│ Điểm Hiểu Chèo   +1                  │
│ Lời chứng đã mở  1                   │
│ AI Vén Màn       1/2 câu             │
│ Thẻ Can Thiệp    Dùng 0              │
│ Nhịp–Phách       Chưa thử            │
└──────────────────────────────────────┘
 24
 [ SANG CHƯƠNG 2 → ]    (chương 5: "KẾT THÚC VÁN")
 12
 [ Xem lại chương ]
```
- Mọi số lấy từ `events` lọc theo chương. Chương 5 → tổng kết cả ván (thêm khối "Toàn ván") và nút "Chơi ván mới".
- `objective` đã có ở `data/chapters.ts` (chưa được dùng), là nội dung sẵn có; các `description` là `[CONTENT TO BE PROVIDED]` nên **không hiển thị**.
- **AC:** AC-TK-1 số liệu khớp với `events`; AC-TK-2 "Sang chương n+1" đặt `chapter` và quay về hub; AC-TK-3 chương 5 có "Kết thúc ván" và "Ván mới".
- **Thay đổi:** `[LOGIC]` + `[CSS]`; `[CONTENT]` (câu hỏi suy ngẫm nên được chủ dự án duyệt).

### 5.12 Home — `/` (chỉ phần liên quan, không thiết kế lại)
- Bố cục giữ nguyên. Các thẻ vật lý (`physical-card`) dẫn tới **route thật** (`/tich-truyen`, `/kiem-chung`, `/goc-nhin`, `/ai-ven-man`, `/nhip-phach`).
- Cần sửa copy: mục 7. Dải 5 chương (hiện cả năm nút cùng `go('game')`) trỏ tới `/hanh-trinh?chuong=N`.
- **AC:** AC-HOME-1 mọi liên kết trong dải 5 chương có `href` khác nhau; AC-HOME-2 không còn chuỗi "25 Góc nhìn" / "Quét thẻ Oan" / "Xem 25 góc nhìn".

### 5.13 Về dự án — `/gioi-thieu`
- `.about-grid` **1 cột ≤800px** (hiện 3 cột không gập), 3 khối `stage` cách nhau 16.
- Đổi tiêu đề "Kho tri thức" → "AI Hỏi Đáp Di Sản" và mô tả đúng thực tế (mục 8). Thêm mục **"Nguồn & ghi nhận"** (mục 9).
- **AC:** AC-AB-1 không còn từ "kho tri thức" khi kho không tồn tại; AC-AB-2 có mục Nguồn & ghi nhận.

---

## 6. Thử thách Nhịp–Phách (đặc tả đầy đủ)

### 6.1 Lỗi hiện tại (đã xác nhận trong code)
1. Ghi "Quan sát nhịp" nhưng **không phát/hiển thị mẫu** (hằng `sequence=[0,420,840,1260,1680]` chỉ dùng để đếm 5 ô).
2. Sau kết quả `result!==null` chặn mọi lần gõ; **không có nút Thử lại**, dù copy hiện "Bạn còn 1 lượt thử".
3. Điểm chỉ so **khoảng từ lần gõ đầu tới lần cuối** với 1680ms (`100 − |span − 1680|/25`), nên gõ sai từng nhịp (ví dụ 4 tiếng gõ nhanh rồi chờ tiếng cuối) vẫn ra 100%.
4. `+1/+2 điểm Hiểu Chèo` chỉ là chữ; không ghi vào session (`hieu` không đổi, `rhythmAttempts/Best/Used` không được dùng).
5. Không liên kết Thẻ Can Thiệp "Giữ nhịp câu chuyện".
6. Ô nhập mã thiếu `<label for>`; dùng sự kiện `onClick` (trễ và không chính xác thời gian trên di động).

### 6.2 Dữ liệu mẫu nhịp (cấu hình, không hard-code trong component)

```ts
type RhythmCard = {
  code: string            // '2714'
  level: number           // 1
  beats: number[]         // mốc thời gian mong đợi, ms từ phách 1: [0, 420, 840, 1260, 1680]
  perfectMs: number       // 60   vùng chấp nhận "đúng phách"
  zeroMs: number          // 250  sai lệch bị chấm 0
  passAt: number          // 80
  excellentAt: number     // 95
  baseAttempts: number    // 2
}
```
Mẫu cấp 1 lấy đúng số hiện có (5 phách, 420ms ≈ 143 BPM). Chủ dự án cung cấp mẫu và âm thanh cho các cấp khác `[CONTENT]`; đặc biệt nội dung Chèo thật (nhịp/phách khác nhau) chưa có, nên spec **không tự đặt** ý nghĩa văn hóa cho từng tiếng.

### 6.3 Máy trạng thái

```
[Nhập mã] ─mã đúng─► [Sẵn sàng: chưa nghe]
                          │ bấm "Nghe mẫu"
                          ▼
                     [Đang phát mẫu] ─hết mẫu─► [Đến lượt bạn]
                          ▲                          │ gõ phách 1
                 "Nghe lại mẫu"                      ▼
                          └────────────────────  [Đang gõ (k/5)]
                                                     │ đủ 5 phách   │ im >2s giữa chừng
                                                     ▼              ▼
                                               [Kết quả]      [Bị ngắt: không tính lượt] ─► [Đến lượt bạn]
                       ┌──────────────┬───────────────┼───────────────────────┐
                       ▼              ▼               ▼                       ▼
                  Đạt ≥80%     Chưa đạt, còn lượt   Chưa đạt lượt 1,      Chưa đạt, hết lượt
                 (+1 / +2)     → "Thử lại"          Can Thiệp chưa dùng   → "Luyện tập"
                                                    → "Dùng Thẻ Can Thiệp"
```

| Trạng thái | Nút chính | Ghi chú |
|---|---|---|
| Nhập mã | "Mở thử thách" | lỗi mã: "Mã chưa khớp thẻ nào." (đổi khỏi "dữ liệu mô phỏng") |
| Sẵn sàng (chưa nghe) | "Nghe mẫu" | vùng gõ **disabled**, dòng "Nghe mẫu trước khi gõ." |
| Đang phát mẫu | (không) | vùng gõ khóa; nút "Nghe mẫu" thành "Đang phát..." |
| Đến lượt bạn | vùng gõ (bàn gõ lớn) | "Gõ 5 phách theo mẫu. Phách đầu là mốc bắt đầu." |
| Đang gõ | vùng gõ | 5 ô phách sáng dần theo số lần gõ |
| Kết quả · đạt | "Về game hub" / "Thử thẻ khác" | banner success |
| Kết quả · chưa đạt, còn lượt | **"Thử lại"** | "Nghe lại mẫu" phụ; nếu chưa dùng `i-02`, hiện thẻ gợi ý bên dưới |
| Kết quả · hết lượt | "Luyện tập (không tính điểm)" | banner warning; Về game hub |
| Luyện tập | "Nghe mẫu" / gõ | mọi kết quả chỉ hiển thị, không ghi `events` |

### 6.4 Nghe mẫu (hình + tiếng)
- **Hình (kênh chính):** hàng 5 ô phách (mỗi ô 48x48, cách nhau 8; tổng 5·48+4·8 = 272px ≤ 343px) sáng lần lượt đúng mốc thời gian mẫu; dưới hàng ô là chuỗi chữ "1 · 2 · 3 · 4 · 5" để người khiếm thị màu thấy vị trí. Khi phát: ô đang phát có viền `--accent` dày 3px + nền `--primary`; không dùng chuyển động (chỉ đổi màu/viền), nên **vẫn đúng với `prefers-reduced-motion`**.
- **Tiếng:** Web Audio API (`AudioContext`), phát tiếng "phách" ngắn (nốt vuông 880Hz, ~60ms) đúng mốc; không cần tệp âm thanh. Chỉ khởi tạo sau cử chỉ người dùng (bấm "Nghe mẫu") vì chính sách tự phát. Có nút bật/tắt âm (`aria-pressed`, nhãn "Âm thanh: bật/tắt"), mặc định bật; hiển thị gợi ý khi hàng ô chạy mà `AudioContext.state` không phải `running`. Vì công tắc chuông trên iPhone có thể tắt Web Audio, **mẫu luôn dùng được bằng hình**; đồng thời `navigator.vibrate?.(30)` mỗi phách khi được hỗ trợ.
- Lập lịch tiếng bằng `AudioContext.currentTime` (không dùng `setTimeout` cho tiếng); đồng bộ hình bằng `requestAnimationFrame`.
- Nghe lại mẫu **không giới hạn** và **không tính lượt**.

### 6.5 Gõ và chấm điểm

**Bắt sự kiện:** dùng `onPointerDown` với `event.timeStamp` (không dùng `click`, vốn trễ trên di động); vùng gõ `touch-action:manipulation`, cao ≥140px, full width; hỗ trợ bàn phím (Space/Enter) cho desktop. Bỏ qua lần gõ cách lần trước <120ms (nảy phím/chạm đúp). Nếu im lặng >2000ms sau phách 1 → lượt **bị ngắt, không tính lượt**, quay về "Đến lượt bạn" kèm dòng "Nhịp bị ngắt. Thử lại, lượt này không bị tính."

**Thuật toán (chấm theo từng khoảng giữa các phách, thay vì chỉ tổng thời gian):**
```
T[i] = beats[i] - beats[i-1]        // i = 1..4, khoảng mẫu (420ms)
d[i] = tap[i] - tap[i-1]            // khoảng người chơi gõ
e[i] = |d[i] - T[i]|
s[i] = clamp(1 - max(0, e[i] - perfectMs) / (zeroMs - perfectMs), 0, 1)
pct  = round(100 * mean(s[1..4]))
```
Phách 1 là **mốc** (không có gì để so), nên 4 khoảng được chấm; hiển thị phách 1 là "Mốc".

**Nhãn từng phách (2..5):** `e ≤ 60` "Đúng phách"; `60 < e ≤ 150` "Hơi sớm"/"Hơi muộn" (theo dấu của `d − T`); `e > 150` "Lệch nhiều". Mỗi nhãn kèm icon (`Check` / `TriangleAlert` / `X`) và số ms ("+45ms"), không chỉ màu.

**Mức đạt:** `pct ≥ 95` "Qua vòng xuất sắc" (+2 Hiểu Chèo); `≥ 80` "Qua vòng" (+1); còn lại "Chưa đạt ngưỡng 80%". Chỉ ghi `awarded` của **lần tốt nhất** và cộng phần chênh (không cộng dồn qua lượt).

**Vectơ kiểm thử (đơn vị, hàm thuần):** `scoreRhythm(beats, taps)`

| Taps (ms) | Khoảng gõ | Kết quả kỳ vọng |
|---|---|---|
| `0, 420, 840, 1260, 1680` | 420×4 | **100** (xuất sắc) |
| `0, 300, 600, 900, 1200` (đều nhưng quá nhanh) | 300×4 → e=120 | **68**, chưa đạt |
| `0, 420, 840, 1360, 1680` (1 phách hơi sớm) | 420, 420, 520, 320 → e = 0,0,100,100 | **89**, qua vòng |
| `0, 100, 200, 300, 1680` (**cách khai thác cũ**: span=1680) | 100,100,100,1380 → e ≥ 320 | **0**, chưa đạt (cũ ra 100) |
| `0, 460, 920, 1380, 1840` | 460×4 → e=40 | **100** (trong vùng chấp nhận) |

### 6.6 Số lượt và Thẻ Can Thiệp "Giữ nhịp câu chuyện" (`i-02`)
- **Số lượt cơ bản = 2** (khớp copy "Bạn còn 1 lượt thử" sau lượt 1). `[ASSUMPTION]` (Q8).
- Sau **lượt 1 chưa đạt** (<80%) và nếu `i-02` chưa dùng: hiện thẻ gợi ý ngay dưới kết quả: "Thẻ Can Thiệp: Giữ nhịp câu chuyện. Thêm 1 lượt thử." → nút "Dùng thẻ" (qua hộp xác nhận 2.12) ⇒ tối đa 3 lượt. Hiệu ứng **được thực thi bởi web** (đây là thẻ duy nhất có hiệu ứng có thể thi hành thật).
- Khớp đúng chữ trên thẻ: điều kiện "Sau lần thử đầu tiên dưới 80%", thời điểm "Ngay sau lần thử Nhịp–Phách".
- Từ màn Can Thiệp: thẻ `i-02` có liên kết "Đi tới Nhịp–Phách"; eligible khi `rhythm['2714'].attempts ≥ 1 && !passed`.

### 6.7 Kết quả, lưu, và các trạng thái phụ
- Lưu sau **mỗi lượt được chấm** vào `rhythm[code]` và `events` (`type:'rhythm'`); tải lại giữ nguyên số lượt còn lại (không thể làm lại bằng refresh). Lượt bị ngắt không ghi.
- Vùng kết quả `role="status"` `aria-live="polite"`; đọc: "Kết quả 90 phần trăm. Qua vòng. Cộng 1 điểm Hiểu Chèo."
- Kết quả hiển thị: `%` lớn (32–40px), nhãn mức đạt, 5 chip phách (mốc + 4 nhãn), dòng điểm, và các nút theo bảng 6.3. **Luôn có ít nhất một nút tiếp theo** (hiện là ngõ cụt).

### 6.8 Layout 390px
```
 [← Về game hub]
 eyebrow  THẺ NHỊP–PHÁCH  ·  MÃ 2714 · CẤP ĐỘ 1
 h1       Lắng nghe
          rồi đáp lại.
 32
┌ stage ───────────────────────────────┐ padding 24 (mốc: hiện 32 desktop), gap 16
│ Lượt 1/2                     [🔊 Bật]│ chip 14px; nút âm ≥44x44
│ Nghe mẫu, rồi gõ đúng 5 phách.       │ 16/26
│ [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ]            │ ô 48x48, gap 8
│ 1 · 2 · 3 · 4 · 5                    │ 14px
│ [ ▶ NGHE MẪU ]                       │ phụ (viền), 48px
│ ┌──────────────────────────────────┐ │
│ │        GÕ THEO PHÁCH             │ │ vùng gõ ≥140px cao, chính
│ └──────────────────────────────────┘ │
│ Trong Chèo, nhịp và phách góp phần   │ 14px muted
│ giữ thời gian cho câu hát...         │
└──────────────────────────────────────┘
 (kết quả: khối stage thứ hai, cách 16, chứa %, 5 nhãn phách, nút)
```
**Desktop:** cột 720px; vùng gõ cao 160px; hàng ô phách 56px.

### 6.9 AC
- AC-NP-1: có bước "Nghe mẫu": hàng ô sáng lần lượt trong ~1.7s; nút "Nghe mẫu" hoạt động không cần âm thanh.
- AC-NP-2: vùng gõ disabled cho tới khi nghe mẫu ít nhất một lần.
- AC-NP-3: `scoreRhythm` qua toàn bộ vectơ ở 6.5 (test đơn vị, pytest/jest tùy chọn của repo; hiện repo chưa có khung test, xem Q10).
- AC-NP-4: sau kết quả chưa đạt ở lượt 1 xuất hiện nút "Thử lại"; bấm cho phép gõ lượt 2 và hiển thị "Lượt 2/2".
- AC-NP-5: dùng `i-02` sau lượt 1 ⇒ hiển thị "Lượt 2/3" và cho tối đa 3 lượt; sự kiện `intervention` được ghi.
- AC-NP-6: đạt ≥80% ghi `hieu` +1 (hoặc +2 ≥95%) vào session; hub cập nhật; tải lại không cộng lại.
- AC-NP-7: nhãn 5 phách hiển thị chữ + icon; kết quả có `aria-live`.
- AC-NP-8: vùng gõ, ô nhập mã, nút âm đều ≥44px; ô nhập mã có `<label for>`.
- AC-NP-9: với `prefers-reduced-motion: reduce`, bước Nghe mẫu vẫn truyền đạt nhịp bằng đổi màu/viền và không có chuyển động trượt/phóng.

**Thay đổi:** phần lớn là `[LOGIC]` (thuật toán, trạng thái, âm thanh, lượt, ghi session, liên kết Can Thiệp); `[CSS]` layout; `[COPY]` chữ trạng thái; `[CONTENT]` mẫu nhịp/âm thanh cho cấp khác.

---

## 7. Sửa copy: hứa hơn nội dung có thật

Mặc định: **sửa copy, không thêm nội dung** (brief). "Khi nào quay lại" ghi điều kiện để trả câu chữ cũ.

| Vị trí | Copy hiện tại | Vấn đề | Copy mới (đề xuất) | Trả lại khi |
|---|---|---|---|---|
| Home, `feature-card` | "25 Góc nhìn" / "Không phải để chọn ai đúng" | chỉ có 3 | **"Góc Nhìn"** / "Mỗi nhân vật thấy một phần sự việc" | có đủ 25 |
| Home, `investigation-teaser` | "Xem 25 góc nhìn" | như trên | **"Thử một Thẻ Góc Nhìn"** | có đủ 25 |
| Home, `feature-card` | "Kiểm chứng" / "Quét thẻ Oan, đọc lời chứng" | không có máy quét | **"Kiểm chứng"** / "Đọc tình huống Oan, nhập mã, đọc lời chứng" | QR deep link đã in (D7): "Quét mã QR trên thẻ, đọc lời chứng" |
| Hướng dẫn bước 3 | "Quét hoặc nhập mã" / "Mở đúng trang QR..." | như trên | **"Nhập mã trên thẻ"** / "Nhập mã 4 chữ số của Thẻ Góc Nhìn để đọc lời chứng của nhân vật." | như trên |
| Hành trình, eyebrow | "52 Ô · 5 CHƯƠNG · PHIÊN ĐANG LƯU" | ô đang chọn không được lưu | **"BẢN ĐỒ HÀNH TRÌNH · 52 Ô · 5 CHƯƠNG"** | có tính năng theo dõi vị trí |
| Hành trình, số tiến độ | "ĐANG ĐỨNG Ở Ô 1" | ngụ ý theo dõi vị trí | **"Ô ĐANG XEM: 1"** | như trên |
| Hành trình, nút chi tiết | "Tiếp tục" (về hub) | vô nghĩa | ẩn khi không có đích (5.9) | có đích |
| Home, dải 5 chương | cả 5 nút → `/game` | không phân biệt | → `/hanh-trinh?chuong=N` | có nội dung theo chương |
| Về dự án | "Kho tri thức: Nội dung được tổ chức theo loại hình, khái niệm, nhạc cụ..." | kho không truy cập được | **"AI Hỏi Đáp Di Sản"**: "Trợ lý học tập trả lời về nghệ thuật truyền thống Việt Nam, ưu tiên nguồn đã kiểm chứng. Câu trả lời của AI chỉ là điểm bắt đầu, không thay thế tư liệu chuyên ngành." | kho di sản quay lại |
| Về dự án (lead) | "...kết nối kho tri thức nghệ thuật truyền thống..." | như trên | "...kết nối trợ lý hỏi đáp về nghệ thuật truyền thống với trải nghiệm của bộ board game vật lý." | |
| Hub, panel Tích Truyện | "Thẻ thường hoặc Thẻ Tích Truyện có dấu Oan. Thẻ Oan không phải một bộ bài riêng." | mơ hồ | **"Người Kể Tích đọc thẻ cho cả nhóm. Thẻ có dấu Oan sẽ mở tình huống điều tra."** | |
| Hub, nhãn điểm | "ĐIỂM OAN" | không rõ hướng | "ĐIỂM OAN" + dòng "Oan càng thấp càng tốt" (chờ Q4) | |
| Nhịp–Phách, lỗi mã | "Mã chưa khớp dữ liệu mô phỏng." | lộ chữ "mô phỏng" | "Mã chưa khớp thẻ nào." | |
| Nhịp–Phách kết quả | "Bạn còn 1 lượt thử." | không có nút thử lại | (giữ chữ, thêm nút "Thử lại"; xem 6) | |
| Vén Màn chương-dò | "Đã dùng hết lượt hỏi... Hãy chọn chương khác..." | không có cách chọn chương ngay tại đó | thêm nút "Đổi chương" | |
| Nav | "CHIẾU CHÈO SƯƠNG OAN" | trùng logo, dài | **"TRÒ CHƠI"** | |
| Game hub `lead` | "Website không thay thế bàn chơi..." | đúng, giữ | giữ | |

Nguyên tắc: mọi chữ hứa một **tính năng** ("quét", "lưu", "kho") phải trỏ tới thứ tồn tại; nếu còn nghi ngờ, chọn mô tả hành động người dùng thực sự làm ("nhập mã", "xem").

---

## 8. Kho "Khám phá di sản" (Archive / Article)

**Khuyến nghị: không khôi phục ở đợt này; sửa lời hứa và bỏ code chết sau.**

Lý do (bằng chứng trong code):
1. Nội dung là **mẫu**: các tab của Article (Đặc trưng, Âm nhạc, Vai diễn, Giá trị văn hóa) đều chỉ là một câu **sinh từ template** "`{tên}` được nhận diện qua {khái niệm}...", gần như giống nhau cho mọi hồ sơ; chính Article ghi "Nội dung mô phỏng cho prototype giáo dục; cần đối chiếu..."; ảnh dùng lại 3 tệp `heritage-gallery-*`.
2. **8/11 hồ sơ ngoài phạm vi Chèo** (Tuồng, Cải lương, Quan họ...), nhưng sản phẩm là companion cho **một** board game về Chèo/Thị Kính.
3. `AI Hỏi Đáp` (RAG) đã đáp ứng nhu cầu "hỏi về di sản" cho học sinh mà không cần duy trì thêm 11 trang.
4. Khôi phục = thêm 1 mục nav + 2 route + nội dung kiểm chứng; tốn kém hơn nhiều so với giá trị ở đợt này, trong khi luồng game còn nhiều lỗi lõi.

Hành động: (a) sửa copy About/Hướng dẫn (mục 7); (b) **dành sẵn** route `/di-san` và `/di-san/[slug]` trong bản đồ IA nhưng chưa dựng; (c) tách hồ sơ "Chèo" (`arts[0]`) thành gợi ý "Tìm hiểu thêm" trong Vén Màn nếu chủ dự án cần; (d) xóa `LegacyApp`, `Archive`, `Article`, `Game`, `Oan`, `Ven` (~40% `_app-shell.tsx`) trong một lượt dọn riêng (**ngoài phạm vi spec này**, đã có trong "NGOÀI PHẠM VI" của prompt B). Nếu chủ dự án muốn quay lại kho: cần **nội dung được kiểm chứng** cho từng hồ sơ (`[CONTENT]`) trước khi có UI.

## 9. Footer, ghi nhận và nguồn

**Hiện trạng:** `LegacyApp` có footer ("CHIẾU CHÈO SƯƠNG OAN · Một không gian học tập về nghệ thuật truyền thống Việt Nam"), giao diện thật thì không.

**Đề xuất:** một footer dùng chung cho **mọi** trang (trong layout chung), thấp và không dính đáy khi nội dung ngắn (`min-height` cho `main`).

```
──────────────────────────────────────── (viền trên 1px --border)
 CHIẾU CHÈO SƯƠNG OAN                    logo chữ, 14px
 Một không gian học tập về nghệ thuật
 truyền thống Việt Nam.                  14px muted

 Hướng dẫn   Về dự án   Nguồn & ghi nhận     liên kết cao ≥44, wrap, gap 8

 Nội dung do AI tạo có thể chưa chính xác; hãy đối chiếu nguồn.   14px
 Hình minh họa mang tính giáo dục, không phải tư liệu lưu trữ.    14px
 © [CONTENT TO BE PROVIDED: đơn vị thực hiện / năm / giấy phép]   14px
```
- Trong `/gioi-thieu`, mục **"Nguồn & ghi nhận"** liệt kê: nguồn tư liệu của AI (các giá trị `source` của dữ liệu/RAG khi có), quyền hình ảnh, đơn vị thực hiện, liên hệ. **Toàn bộ là `[CONTENT TO BE PROVIDED]`**: spec không tự bịa tên, năm hay giấy phép.
- Trên `/game` và các thẻ (thường xem trong tay), footer vẫn hiển thị dưới cùng, không làm thay đổi bố cục thẻ (khoảng 48 trước footer).
- **AC:** AC-FT-1 mọi route có `<footer>` với ≥3 liên kết cao ≥44px; AC-FT-2 không có tiêu đề/dòng chữ nào ở footer nhỏ hơn 14px; AC-FT-3 chữ ghi nhận thiếu được đánh dấu rõ ràng chờ nội dung, không để trống hay bịa.
- **Thay đổi:** `[LOGIC]`/markup (layout chung) + `[CSS]`; `[CONTENT]`.

---

## 10. Sổ thay đổi (phân loại) và thứ tự làm

### 10.1 Phân loại

| Mã | Nhóm | Hạng mục | Tham chiếu |
|---|---|---|---|
| C1 | **[CSS]** | Khối token + rule **một** hệ thống thẻ; xóa các bản định nghĩa trùng của `.game-panel`, `.oan-card`, `.ven-question`, `.testimony`... | 2.4–2.9 |
| C2 | **[CSS]** | Lưới 1 cột ≤800px (`.game-grid`, `.about-grid`, `.feature-grid`, lưới Can Thiệp) | 2.4 |
| C3 | **[CSS]** | Hộp nhập mã (nhãn/ô/nút dọc, viền đặc, cỡ 56px), bộ đếm Vén Màn, `.story-symbol` 40x40 | 2.8, 5.2, 5.4, 5.6 |
| C4 | **[CSS]** | Sửa tương phản: bỏ vàng/`--muted-foreground` trên `paper`; nâng chữ 10–11px → 12px; hover chỉ trong `@media (hover:hover)` | 2.3, 2.10 |
| C5 | **[CSS]** | Bảng Hành trình vừa 390px (phương án tạm 6 cột), chú giải | 5.9 |
| C6 | **[CSS]** | Sticky action bar Vén Màn, thanh nhập AI Hỏi Đáp có safe-area | 5.6, 5.7 |
| C7 | **[CSS]** | Footer | 9 |
| L1 | **[LOGIC]** | Routing: URL là nguồn sự thật, thêm 6 route + redirect, `notFound`, metadata, layout chung | 3 |
| L2 | **[LOGIC]** | Session v2 (event log), Provider, loading, `try/catch`, `lastPath` | 4.3 |
| L3 | **[LOGIC]** | Vòng đời ván: bắt đầu/đổi chương/tiến thẻ/tổng kết/reset/tham gia giữa chừng | 4 |
| L4 | **[LOGIC]** | Nhịp–Phách: mẫu, âm thanh, chấm từng phách, lượt/thử lại, ghi điểm, liên kết Can Thiệp | 6 |
| L5 | **[LOGIC]** | Góc Nhìn: tách 3 lỗi, kiểm tra khi bấm, không tính trùng, `?ma`, trạng thái theo `effect` | 5.4 |
| L6 | **[LOGIC]** | Can Thiệp: xác nhận, điều kiện mềm, ghi sự kiện, hiệu ứng `i-02` | 5.5 |
| L7 | **[LOGIC]** | Vén Màn: trừ lượt khi nhận `ok`, lưu vòng dở, timeout/thử lại, chip chương | 5.6 |
| L8 | **[LOGIC]** | Hành trình: tab chương, tham số, đích nút theo loại ô | 5.9 |
| L9 | **[LOGIC]** | Hub: dòng thẻ có trạng thái, chọn chương, "Tiếp tục", reset | 5.1 |
| L10 | **[LOGIC]** | Hợp nhất dữ liệu game vào `data/` (một nguồn, id ổn định), bỏ code nội tuyến | 3.5 |
| T1 | **[COPY]** | Toàn bộ bảng mục 7 + nhãn nav "Trò chơi" | 7 |
| K1 | **[CONTENT]** | Mẫu nhịp/âm thanh cấp khác; thẻ Tích Truyện/Oan/Góc Nhìn cho Chương 2–5; câu gợi ý Vén Màn; thông tin ghi nhận & nguồn; xác nhận loại ô Hành trình | 1.3, 6.2 |

### 10.2 Thứ tự đề xuất
1. **Đợt 1 (sửa lỗi hiển thị, chỉ CSS/markup):** C1–C5, T1 (phần sửa copy đơn giản), menu mobile (đang xử lý riêng). Không phụ thuộc quyết định sản phẩm. *Tương thích với prompt B*: cùng nhịp spacing (24/32, gap 16); **khác** ở chỗ B tô kem cho hộp nhập/câu hỏi (spec khuyến nghị nền `stage`), và B dùng 8 cột cho Hành trình (ô ~36px, dưới 44px). Nếu đợt 1 đã làm theo B, coi đó là trạng thái tạm và áp mục 2.6/5.9 khi có lượt kế.
2. **Đợt 2 (routing + session):** L1, L2, L10, footer (C7). Mở khóa QR và mọi luồng sau.
3. **Đợt 3 (vòng chơi):** L4 (Nhịp–Phách), L5, L6, L7.
4. **Đợt 4 (vòng đời):** L3, L9, 5.11, L8.
5. **Đợt 5 (nội dung):** K1 và trả lại copy ở mục 7 khi đủ điều kiện.

### 10.3 Tách riêng: chỉ CSS so với đổi logic
- **Chỉ CSS/markup** (không đổi hành vi): C1–C7, phần lớn 5.2/5.3/5.5 về hình thức.
- **Bắt buộc đổi logic:** Nhịp–Phách (L4), routing (L1), reset/vòng đời (L3), session v2 (L2), Vén Màn (L7), Góc Nhìn (L5), Can Thiệp (L6).
- **Chỉ chữ:** T1.

### 10.4 Bộ AC chung (mọi route, 390x844 và 1440x900)
1. `document.documentElement.scrollWidth <= innerWidth` trên mọi route (kể cả `/hanh-trinh`).
2. Mọi thẻ trong luồng game có padding trái/phải ≥ 24px (mobile) và ≥ 32px (desktop); không có hai phần tử anh em liền kề trong một thẻ có khoảng cách 0 (tiêu đề–đoạn–nút, thẻ–thẻ); khoảng giữa các thẻ ≥ 16 (mobile) / ≥ 24 (desktop).
3. Mọi `button`, `a`, `input`, `textarea` tương tác cao ≥ 44px (trừ liên kết nội dòng trong đoạn văn); khoảng cách giữa hai mục tiêu ≥ 8px.
4. Không phần tử hiển thị nào có `font-size < 12px`; đoạn `<p>` nội dung ≥ 16px; nhãn nút/ô nhập ≥ 14px.
5. Tương phản chữ ≥ 4.5:1, chữ lớn và viền ô nhập/icon ≥ 3:1 (đo bằng axe hoặc bảng 2.3). Không dùng `--accent` hay `--muted-foreground` trên `paper`.
6. Mỗi route: đúng một `<h1>`, một `<main>`, `<title>` duy nhất theo route, có "Bỏ qua điều hướng", `lang="vi"`.
7. Điều hướng bằng bàn phím tới mọi điều khiển, `:focus-visible` thấy rõ; hộp thoại bẫy focus và trả focus khi đóng; Esc đóng menu/hộp thoại.
8. `prefers-reduced-motion: reduce`: không có chuyển động trượt/phóng/lặp vô hạn; thông tin không mất.
9. Không thông tin nào chỉ hiển thị khi hover; không thao tác nào chỉ làm được bằng kéo hoặc nhấn giữ.
10. Trạng thái không chỉ dựa vào màu: mọi success/warning/error/used có icon và chữ.
11. Refresh ở mọi route trong luồng game hiển thị đúng màn (đường dẫn = màn hình); Back của trình duyệt quay về màn liền trước đúng.
12. Không lỗi console mới; `/favicon.ico` không 404 (xử lý ở luồng metadata riêng).
13. `localStorage` bị chặn → app vẫn chạy trong bộ nhớ với thông báo, không crash.
14. Chạy Playwright ở 390x844 và 1440x900 trên `/`, `/hoi-dap`, `/game`, `/tich-truyen/story-01`, `/kiem-chung`, `/goc-nhin` (nhập `1842`, `5931`, `7264`, `0000`), `/can-thiep`, `/nhip-phach` (mã `2714`), `/ai-ven-man` (mô phỏng phản hồi API), `/hanh-trinh`, `/huong-dan`, `/gioi-thieu`, `/game/tong-ket`.

---

## 11. Giả định và câu hỏi mở

### 11.1 Giả định đã dùng (`[ASSUMPTION]`, chưa được chủ dự án xác nhận)
| # | Giả định | Tác động nếu sai |
|---|---|---|
| A1 | Điện thoại dọc là thiết bị chính (mặc định trong brief). | Nếu máy tính bảng/laptop trên bàn là chính, tăng trọng số bố cục desktop; spec vẫn dùng được. |
| A2 | Chưa đủ 25 Góc Nhìn: sửa copy, **không** thêm nội dung (mặc định trong brief). | Nếu sắp có, giữ chữ cũ và làm các `[CONTENT]` trước. |
| A3 | Web là **sổ ghi/trợ lý**, luật bàn chơi vật lý là trọng tài (Can Thiệp chỉ ghi nhận, điều kiện mềm; Góc Nhìn không giới hạn số lần xem). | Nếu web phải thi hành luật, cần luật chính thức: số Góc Nhìn/Oan, phạm vi thẻ Can Thiệp (mỗi ván hay mỗi chương). |
| A4 | "Điểm Oan" thấp hơn là tốt (suy từ `effect`: −1 khi lời chứng giúp làm rõ). | Nếu ngược lại, đổi nhãn và màu chip "Điểm Oan". |
| A5 | Mỗi thẻ Can Thiệp dùng **1 lần mỗi ván** (không theo chương). | Nếu theo chương, đưa vào bộ đếm theo `ch`. |
| A6 | Nhịp–Phách có **2 lượt** cơ bản (theo copy "Bạn còn 1 lượt thử"), Giữ nhịp (`i-02`) thêm 1 lượt, chỉ dùng sau lượt 1. | Nếu luật gốc 1 lượt, đặt `baseAttempts=1` và giữ nhịp chính là lượt thử lại (đổi copy "Bạn còn 1 lượt thử"). |
| A7 | Hành trình là bản đồ tham khảo, không theo dõi quân cờ; loại ô hiện là **công thức giữ chỗ**, không phải dữ liệu bàn thật. | Nếu cần theo dõi vị trí, thêm `position` vào session và trả lại "phiên đang lưu". |
| A8 | Ván v1 trong `localStorage` bị bỏ (prototype, chưa có người dùng thật). | Nếu có người dùng thật, viết bước migrate (`legacy` event). |
| A9 | Mỗi điện thoại có **ván riêng**, không đồng bộ giữa các máy; nhãn "Sổ điểm trên máy này". | Nhu cầu đồng bộ cần backend (ngoài phạm vi). |
| A10 | Các vai: Tích Truyện = Người Kể Tích, Góc Nhìn = Người Soi Chứng, các thẻ còn lại = "Cả nhóm". | Nếu khác, sửa nhãn ở hub. |
| A11 | Chưa có mã QR nào đã in; tuy vậy **mọi URL đang chạy được giữ nguyên** nên thẻ đã in (nếu có) vẫn hoạt động. | Nếu đã in, chốt bảng URL ở 3.5 ngay và không đổi id thẻ. |
| A12 | Kho di sản không khôi phục ở đợt này (mục 8). | Nếu muốn giữ, cần nội dung kiểm chứng trước. |
| A13 | Vén Màn: trừ lượt khi server trả `verdict:'ok'`; lượt bị từ chối/lỗi là miễn phí. | Nếu chủ dự án muốn tính cả lượt hỏi bị từ chối, đổi điều kiện trừ. |
| A14 | Đầu ra là **một** tệp Markdown (theo yêu cầu). Quy trình `gds-ux` thông thường tạo cặp `DESIGN.md` + `EXPERIENCE.md` và hỏi qua phỏng vấn; do chạy không giám sát, tài liệu này gộp hai phần (thị giác: mục 2; hành vi: mục 3–6) và mọi câu hỏi phỏng vấn được thay bằng giả định trên. Chưa chạy các lượt reviewer (validation) của `gds-ux`. | Có thể tách thành hai tệp và chạy validation sau. |

### 11.2 Câu hỏi mở (cần chủ dự án trả lời; nêu mặc định đã dùng)
| # | Câu hỏi | Mặc định đã dùng |
|---|---|---|
| Q1 | Điện thoại có phải thiết bị chính không? | Có (A1) |
| Q2 | Có khôi phục kho di sản không? | Không (A12) |
| Q3 | Nhóm dùng một điện thoại ghi điểm chung, hay mỗi người một máy? Có cần đồng bộ? | Mỗi máy một ván (A9) |
| Q4 | "Điểm Oan" cao hay thấp là tốt? | Thấp là tốt (A4) |
| Q5 | Vai/Người dùng của thẻ Can Thiệp, Nhịp–Phách, Vén Màn là ai? | "Cả nhóm" (A10) |
| Q6 | Luật chính thức của Can Thiệp: mỗi ván hay mỗi chương, có giới hạn số Góc Nhìn mỗi Oan? | Mỗi ván, web không giới hạn Góc Nhìn (A3, A5) |
| Q7 | Loại ô Hành trình thật là gì? Có cần theo dõi vị trí? | Giữ chỗ, không theo dõi (A7) |
| Q8 | Nhịp–Phách: bao nhiêu lượt cơ bản, mẫu và âm thanh thật của cấp 2+ là gì? | 2 lượt, chỉ cấp 1 (A6) |
| Q9 | Có cần giới hạn tốc độ phía server cho `/api/ven` và `/api/ask` (hạn mức hiện chỉ ở client, reset/xóa dữ liệu là lách được; model lớn tốn 30–40s)? Câu trả lời đúng/sai được trả xuống client cùng phản hồi (code ghi chú `ponytail:`), học sinh xem được trong devtools. | Ghi vào backlog, ngoài spec UX |
| Q10 | Repo hiện không có khung test (chỉ có `dev/build/start`). Dùng gì cho AC-NP-3 (`scoreRhythm`) và Playwright? | Đề xuất: test đơn vị nhẹ cho hàm thuần + Playwright cho AC chung (quyết định ở lượt kiến trúc) |
| Q11 | Nội dung ghi nhận: đơn vị thực hiện, giấy phép hình ảnh, danh sách nguồn RAG, liên hệ. | `[CONTENT TO BE PROVIDED]` |
| Q12 | Chương 2–5: bao giờ có thẻ Tích Truyện/Oan/Góc Nhìn? Trong lúc chờ, "chương chưa có thẻ" (4.2, 5.1, 5.2) có chấp nhận được không? | Chấp nhận, hiển thị empty state trung thực |
| Q13 | QR: đã in chưa? Nhóm dùng ứng dụng nào để quét (camera gốc hay Zalo, vốn có thể mở trình duyệt nhúng với `localStorage` riêng)? | Giả định camera gốc/trình duyệt chính |
| Q14 | Tên chương: "Oan Thai nuôi trẻ" (`data/chapters.ts`) hay "Oan thai nuôi trẻ" (`lib/chapters.ts`)? | Dùng `lib/chapters.ts` |

---

## 12. Truy xuất yêu cầu (brief → mục)

| Yêu cầu | Mục |
|---|---|
| 1. Hệ thống thẻ/spacing thống nhất | 2, 0 (D1–D4) |
| 2. Từng màn (Hub, Tích Truyện, Oan, Góc Nhìn, Can Thiệp, Vén Màn, Nhịp–Phách, Hành trình) | 5.1–5.9 (+ Tổng kết 5.11) |
| 3. Nhịp–Phách hoàn chỉnh | 6 |
| 4. IA & routing, Back, QR | 3 |
| 5. Vòng đời ván | 4, 5.11 |
| 6. Copy hứa hơn nội dung có thật | 7 |
| 7. Kho di sản | 8 |
| 8. Footer/credit/nguồn | 9 |
| Ràng buộc (≥16px, ≥44px, không hover, AA, reduced-motion) | 1.2, 2.3, 2.10, 2.11, 10.4 |
| Tách logic khỏi CSS | 10.1, 10.3 |
| Giả định mặc định (phone; sửa copy) | 11.1 A1–A2 |
