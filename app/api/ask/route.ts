import { gateway } from 'ai'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

const knowledge = [
  { name: 'Chèo', text: 'Chèo là sân khấu dân gian giàu chất trữ tình ở Bắc Bộ, dùng lối diễn ước lệ, làn điệu và tiếng cười để kể chuyện đời sống.' },
  { name: 'Tuồng', text: 'Tuồng là sân khấu tự sự có hóa trang, động tác và âm nhạc mang tính quy ước cao; hồ sơ hiện có ghi nhận truyền thống cung đình và dân gian.' },
  { name: 'Quan họ', text: 'Quan họ là lối hát giao duyên của liền anh, liền chị vùng Kinh Bắc, nổi bật bởi cách hát đối đáp tinh tế.' },
  { name: 'Ca trù', text: 'Ca trù là nghệ thuật ca hát thính phòng với đào nương, đàn đáy, phách và trống chầu.' },
  { name: 'Múa rối nước', text: 'Múa rối nước là nghệ thuật điều khiển con rối trên mặt nước, gắn với không gian làng quê và thủy đình.' },
  { name: 'Đờn ca tài tử', text: 'Đờn ca tài tử là âm nhạc tài tử Nam Bộ giàu tính ngẫu hứng, thường được chơi trong không gian thân mật.' },
]

export async function POST(request: Request) {
  const { question, mode = 'heritage' } = await request.json()
  if (typeof question !== 'string' || question.trim().length < 2) return NextResponse.json({ error: 'Vui lòng nhập câu hỏi rõ hơn.' }, { status: 400 })
  const relevant = knowledge.filter(item => question.toLowerCase().split(/\s+/).some(word => word.length > 2 && item.text.toLowerCase().includes(word))).slice(0, 3)
  if (!process.env.AI_GATEWAY_API_KEY) return NextResponse.json({ configured: false, message: 'AI hiện chưa được kết nối. Vui lòng cấu hình API để sử dụng tính năng này.', sources: relevant.map(item => item.name) })
  try {
    const result = await generateText({
      model: gateway('openai/gpt-5-mini'),
      system: `Bạn là ${mode === 'game' ? 'AI Vén Màn, trợ lý riêng của board game Chiếu Chèo Sương Oan' : 'AI Hỏi Đáp Di Sản, trợ lý học tập về nghệ thuật truyền thống Việt Nam'}. Chỉ dùng tư liệu được cung cấp. Nếu thiếu dữ liệu, nói chính xác rằng chưa đủ tư liệu đáng tin cậy. Trả lời tiếng Việt, ngắn gọn, phù hợp học sinh. Không bịa trích dẫn. Tư liệu: ${JSON.stringify(relevant)}`,
      prompt: question,
    })
    return NextResponse.json({ configured: true, answer: result.text, sources: relevant.map(item => item.name) })
  } catch {
    return NextResponse.json({ error: 'Không thể kết nối AI lúc này. Trạng thái trò chơi của bạn vẫn được giữ nguyên.' }, { status: 502 })
  }
}
