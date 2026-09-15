import { NextResponse } from 'next/server'

const knowledge = [
  {
    name: 'Chèo',
    text: 'Chèo là sân khấu dân gian giàu chất trữ tình ở Bắc Bộ, dùng lối diễn ước lệ, làn điệu và tiếng cười để kể chuyện.'
  },
  {
    name: 'Tuồng',
    text: 'Tuồng là sân khấu tự sự có hóa trang, động tác và âm nhạc mang tính quy ước cao.'
  },
  {
    name: 'Quan họ',
    text: 'Quan họ là lối hát giao duyên của liền anh, liền chị vùng Kinh Bắc, nổi bật bởi cách hát đối đáp tinh tế.'
  },
  {
    name: 'Ca trù',
    text: 'Ca trù là nghệ thuật ca hát thính phòng với đào nương, đàn đáy, phách và trống chầu.'
  },
  {
    name: 'Múa rối nước',
    text: 'Múa rối nước là nghệ thuật điều khiển con rối trên mặt nước, gắn với không gian làng quê và thủy đình.'
  },
  {
    name: 'Đờn ca tài tử',
    text: 'Đờn ca tài tử là âm nhạc tài tử Nam Bộ giàu tính ngẫu hứng, thường được chơi trong không gian thân mật.'
  }
]

export async function POST(request: Request) {
  const { question, mode = 'heritage' } = await request.json()

  if (typeof question !== 'string' || question.trim().length < 2) {
    return NextResponse.json(
      { error: 'Vui lòng nhập câu hỏi rõ hơn.' },
      { status: 400 }
    )
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json(
      {
        configured: false,
        message: 'AI hiện chưa được kết nối. Vui lòng liên hệ quản trị viên.'
      },
      { status: 503 }
    )
  }

  const relevant = knowledge.filter((item) =>
    question
      .toLowerCase()
      .split(/\s+/)
      .some(
        (word) =>
          word.length > 2 &&
          item.text.toLowerCase().includes(word)
      )
  )

  const context =
    relevant.length > 0
      ? relevant.map((item) => `${item.name}: ${item.text}`).join('\n')
      : 'Không tìm thấy tài liệu liên quan trực tiếp.'

  const systemPrompt =
    mode === 'game'
      ? `Bạn là AI Vén Màn, trợ lý của board game Chiếu Chèo Sương Oan.
Hãy giúp học sinh tìm hiểu Quan Âm Thị Kính và nghệ thuật chèo.
Không tự bịa sự kiện. Phân biệt rõ sự kiện, diễn giải và kết luận.
Nếu có thể, hãy chỉ ra bằng chứng hoặc thông tin giúp học sinh tự suy luận.`
      : `Bạn là AI hỏi đáp di sản văn hóa Việt Nam.
Hãy trả lời rõ ràng, dễ hiểu, phù hợp với học sinh.
Không tự bịa thông tin. Nếu không chắc chắn, hãy nói rõ giới hạn của thông tin.`

  try {
    const response = await fetch(
      'https://api.deepseek.com/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-flash',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Thông tin tham khảo:
${context}

Câu hỏi của học sinh:
${question}`
            }
          ]
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            'Không thể kết nối với DeepSeek lúc này.'
        },
        { status: 502 }
      )
    }

    const answer = data?.choices?.[0]?.message?.content

    if (!answer) {
      return NextResponse.json(
        { error: 'DeepSeek không trả về câu trả lời.' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      configured: true,
      answer,
      sources: relevant.map((item) => item.name)
    })
  } catch {
    return NextResponse.json(
      {
        error: 'Không thể kết nối AI lúc này. Trạng thái trò chơi của bạn vẫn được giữ nguyên.'
      },
      { status: 502 }
    )
  }
}
