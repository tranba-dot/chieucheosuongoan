"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Menu, X, ArrowRight, BookOpen, Sparkles, ChevronRight, Check, LockKeyhole, Eye, TriangleAlert, Volume2, VolumeX } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { CHAPTERS as chapters } from "@/lib/chapters"
import { useGameSession, logEvent, blankSession, type GameSession } from "./_session"
import { chapterStats } from "@/lib/chapterStats"
import { chapters as chapterData } from "@/data/chapters"
import { findRhythmCard, scoreRhythm, rhythmAwarded, type RhythmResult, type BeatLabel } from "@/lib/rhythm"

type Page = "home" | "qa" | "game" | "story" | "oan" | "perspective" | "intervention" | "ven" | "rhythm" | "journey" | "about" | "guide" | "tongket"
type Art = { id:string; name:string; region:string; category:string; period:string; summary:string; image:string; tags:string[]; concepts:string[]; instruments:string[]; works:string[]; source:string }
const arts:Art[]=[
{id:"cheo",name:"Chèo",region:"Bắc Bộ",category:"Sân khấu",period:"Thế kỷ XVI",summary:"Sân khấu dân gian giàu chất trữ tình, tiếng cười và lối diễn ước lệ.",image:"/images/cheo-theatre.png",tags:["sân khấu","dân gian","ước lệ"],concepts:["vai diễn ước lệ","làn điệu","chiếu chèo"],instruments:["trống cơm","nhị","đàn đáy"],works:["Quan Âm Thị Kính","Lưu Bình – Dương Lễ"],source:"Tư liệu giáo dục văn hóa dân gian Việt Nam"},
{id:"tuong",name:"Tuồng",region:"Trung Bộ",category:"Sân khấu",period:"Truyền thống cung đình",summary:"Sân khấu tự sự với hóa trang, động tác và âm nhạc mang tính quy ước cao.",image:"/images/heritage-gallery-1.png",tags:["sân khấu","hóa trang","cung đình"],concepts:["mặt nạ","vũ đạo","lời hát"],instruments:["trống chiến","kèn","đàn nhị"],works:["Sơn Hậu","Đào Tam Xuân"],source:"Tư liệu sân khấu truyền thống Việt Nam"},
{id:"cailuong",name:"Cải lương",region:"Nam Bộ",category:"Sân khấu",period:"Đầu thế kỷ XX",summary:"Loại hình sân khấu kết hợp ca hát, diễn xuất và ngôn ngữ đời sống Nam Bộ.",image:"/images/heritage-gallery-3.png",tags:["sân khấu","nam bộ","tân thời"],concepts:["vọng cổ","tân cổ giao duyên","bài bản"],instruments:["đàn kìm","đàn tranh","guitar phím lõm"],works:["Đời cô Lựu","Tô Ánh Nguyệt"],source:"Tư liệu nghệ thuật sân khấu Nam Bộ"},
{id:"roinuoc",name:"Múa rối nước",region:"Đồng bằng Bắc Bộ",category:"Trình diễn",period:"Nhiều thế kỷ",summary:"Nghệ thuật điều khiển con rối trên mặt nước, gắn với không gian làng quê.",image:"/images/heritage-gallery-3.png",tags:["rối","mặt nước","làng quê"],concepts:["thủy đình","con rối","nghệ nhân"],instruments:["trống","sáo","phách"],works:["Tễu","Múa rồng"],source:"Tư liệu di sản trình diễn Việt Nam"},
{id:"quanho",name:"Quan họ",region:"Kinh Bắc",category:"Âm nhạc",period:"Truyền thống",summary:"Lối hát giao duyên của liền anh, liền chị với cách đối đáp tinh tế.",image:"/images/heritage-gallery-2.png",tags:["dân ca","giao duyên","Kinh Bắc"],concepts:["liền anh","liền chị","đối đáp"],instruments:["giọng hát","trống nhỏ"],works:["Làng quan họ","Canh hát"],source:"Tư liệu dân ca Việt Nam"},
{id:"catru",name:"Ca trù",region:"Bắc Bộ",category:"Âm nhạc",period:"Truyền thống bác học",summary:"Nghệ thuật ca hát thính phòng với tiếng phách, đàn đáy và trống chầu.",image:"/images/heritage-gallery-2.png",tags:["thính phòng","bác học","phách"],concepts:["đào nương","quan viên","trống chầu"],instruments:["đàn đáy","phách","trống chầu"],works:["Hát nói","Thể cách ca trù"],source:"Tư liệu âm nhạc truyền thống Việt Nam"},
{id:"donta",name:"Đờn ca tài tử",region:"Nam Bộ",category:"Âm nhạc",period:"Cuối thế kỷ XIX",summary:"Âm nhạc tài tử giàu tính ngẫu hứng, thường được chơi trong không gian thân mật.",image:"/images/heritage-gallery-2.png",tags:["nam bộ","tài tử","ngẫu hứng"],concepts:["bài bản tổ","ngón đàn","đờn ca"],instruments:["đàn kìm","đàn cò","đàn tranh"],works:["Vọng cổ","Nam ai"],source:"Tư liệu âm nhạc Nam Bộ"},
{id:"hatxam",name:"Hát Xẩm",region:"Bắc Bộ",category:"Âm nhạc",period:"Dân gian",summary:"Lối hát kể chuyện gần gũi, từng vang lên ở bến nước và không gian cộng đồng.",image:"/images/heritage-gallery-1.png",tags:["kể chuyện","đường phố","dân gian"],concepts:["xẩm chợ","lời ca","nhịp phách"],instruments:["đàn bầu","nhị","trống mảnh"],works:["Xẩm thập ân","Xẩm chợ"],source:"Tư liệu nghệ thuật dân gian"},
{id:"bai-choi",name:"Bài chòi",region:"Trung Bộ",category:"Trình diễn",period:"Dân gian",summary:"Không gian vừa chơi, vừa hát, vừa diễn với tiếng hô thai giàu ứng tác.",image:"/images/heritage-gallery-3.png",tags:["trò chơi","ứng tác","trung bộ"],concepts:["anh hiệu","hô thai","chòi"],instruments:["trống chiến","sênh","đàn nhị"],works:["Hô thai","Hội bài chòi"],source:"Tư liệu văn hóa cộng đồng miền Trung"},
{id:"hatvan",name:"Hát văn",region:"Bắc Bộ",category:"Âm nhạc",period:"Truyền thống",summary:"Âm nhạc nghi lễ với giọng hát, nhịp phách và không gian thực hành tín ngưỡng.",image:"/images/heritage-gallery-2.png",tags:["nghi lễ","hát văn","phách"],concepts:["cung văn","hầu đồng","làn điệu"],instruments:["đàn nguyệt","trống ban","phách"],works:["Văn chầu","Làn điệu hát văn"],source:"Tư liệu thực hành tín ngưỡng Việt Nam"},
{id:"danbau",name:"Đàn bầu",region:"Việt Nam",category:"Nhạc cụ",period:"Truyền thống",summary:"Nhạc cụ một dây có âm sắc giàu biểu cảm, gắn với nhiều thể loại âm nhạc Việt.",image:"/images/heritage-gallery-2.png",tags:["nhạc cụ","một dây","âm sắc"],concepts:["bồi âm","cần đàn","hộp đàn"],instruments:["đàn bầu"],works:["Độc tấu đàn bầu"],source:"Tư liệu nhạc cụ truyền thống Việt Nam"},
]
const filters=["Tất cả","Sân khấu","Âm nhạc","Trình diễn","Nhạc cụ"]
type StoryCard={id:string;chapter:number;sequence:number;title:string;content:string;type:'normal'|'oan';oanCaseId?:string};type Perspective={id:string;code:string;name:string;role:string;traits:string[];scope:string;blindSpot:string};type PerspectiveEvidence={cardId:string;oanId:string;text:string;effect:-1|0|1};type Intervention={id:string;name:string;description:string;condition:string;timing:string;effect:string};const storyCards:StoryCard[]=[{id:'story-01',chapter:1,sequence:1,title:'Tiếng trống đầu làng',content:'Một tiếng trống mở hội vang lên. Người Kể Tích giới thiệu làng quê và những quy ước đầu tiên.',type:'normal'},{id:'story-02',chapter:1,sequence:2,title:'Lời truyền bên giếng',content:'Một lời kể truyền qua nhiều người. Có điều gì đó chưa được nhìn đủ từ mọi phía.',type:'oan',oanCaseId:'oan-01'}];
const perspectiveCards:Perspective[]=[{id:'p-01',code:'1842',name:'Bác Độ',role:'Người giữ trống làng',traits:['để ý âm thanh','nhớ trình tự'],scope:'Biết thời điểm trống vang và ai có mặt gần đình.',blindSpot:'Không nghe được những lời nói ở cuối sân đình.'},{id:'p-02',code:'5931',name:'Cô Mận',role:'Người bán hàng bên giếng',traits:['quan sát kỹ','hay suy đoán'],scope:'Biết những người đi qua giếng và lời họ nói.',blindSpot:'Không chứng kiến sự việc trong đình.'},{id:'p-03',code:'7264',name:'Anh Sửu',role:'Người dọn sân hội',traits:['thực tế','ít nói'],scope:'Biết dấu vết và đồ vật còn lại sau buổi hội.',blindSpot:'Không biết câu chuyện bắt đầu từ đâu.'}];
const perspectiveEvidence:PerspectiveEvidence[]=[{cardId:'p-01',oanId:'oan-01',text:'Bác Độ nhớ tiếng trống vang lần đầu trước khi mọi người chạy về phía giếng. Trình tự này không khớp với lời đồn.',effect:-1},{cardId:'p-02',oanId:'oan-01',text:'Cô Mận nghe một câu nói ngắt quãng, nhưng không nhìn thấy người nói. Thông tin gợi mở nhưng chưa đủ.',effect:0},{cardId:'p-03',oanId:'oan-01',text:'Anh Sửu thấy một dải vải ở sân, nhưng không biết nó thuộc về ai hay xuất hiện lúc nào.',effect:1}];
const interventionCards:Intervention[]=[{id:'i-01',name:'Xin thêm một lời chứng',description:'Mở thêm một cơ hội xem Thẻ Góc Nhìn sau kết quả chưa đủ.',condition:'Sau kết quả chưa đủ hoặc chưa giúp làm rõ.',timing:'Ngay sau điều tra Góc Nhìn',effect:'Cho phép nhập thêm một mã Góc Nhìn trong cùng Oan.'},{id:'i-02',name:'Giữ nhịp câu chuyện',description:'Bảo toàn một cơ hội thử Nhịp–Phách sau lần thất bại đầu tiên.',condition:'Sau lần thử đầu tiên dưới 80%.',timing:'Ngay sau lần thử Nhịp–Phách',effect:'Bảo toàn cơ hội tiếp theo.'}];
const pageToPath:Partial<Record<Page,string>>={home:'/',qa:'/hoi-dap',game:'/game',story:'/tich-truyen',oan:'/kiem-chung',perspective:'/goc-nhin',intervention:'/can-thiep',ven:'/ai-ven-man',rhythm:'/nhip-phach',guide:'/huong-dan',about:'/gioi-thieu',journey:'/hanh-trinh',tongket:'/game/tong-ket'};
function AppShell({initialPage='home'}:{initialPage?:Page}){const router=useRouter();const {session,save,storageError,loading}=useGameSession();const [page,setPage]=useState<Page>(initialPage),[menu,setMenu]=useState(false);const go=(p:Page)=>{setPage(p);setMenu(false);window.scrollTo({top:0,behavior:'smooth'});const path=pageToPath[p];if(path)router.push(path)};useEffect(()=>{if(!menu)return;const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')setMenu(false)};window.addEventListener('keydown',esc);return()=>window.removeEventListener('keydown',esc)},[menu]);const navItems:[Page,string][]=[['home','TRANG CHỦ'],['qa','AI HỎI ĐÁP'],['game','TRÒ CHƠI'],['about','VỀ DỰ ÁN']];return <><header className='topbar'><button className='brand' onClick={()=>go('home')}><span>CHIẾU CHÈO</span><b>SƯƠNG OAN</b></button><nav>{navItems.map(([p,l])=><button key={p} onClick={()=>go(p)}>{l}</button>)}</nav><button className='menu-button' aria-label={menu?'Đóng menu':'Mở menu'} aria-expanded={menu} aria-controls='mobile-menu' onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button><div id='mobile-menu' className='mobile-menu' hidden={!menu}>{navItems.map(([p,l])=><button key={p} onClick={()=>go(p)}>{l}</button>)}</div></header>{storageError&&<div className='storage-warning' role='status'>Không lưu được ván trên máy này. Ván sẽ mất khi tải lại trang.</div>}{page==='home'&&<Home go={go}/>} {page==='qa'&&<QA/>} {page==='game'&&<UpdatedGame go={go} session={session} save={save} loading={loading}/>} {page==='story'&&<UpdatedStory card={storyCards.find(x=>x.id===session.storyId)||storyCards[0]} go={go}/>} {page==='oan'&&<UpdatedOan go={go}/>} {page==='perspective'&&<Suspense fallback={null}><UpdatedPerspective go={go} session={session} save={save}/></Suspense>} {page==='intervention'&&<Suspense fallback={null}><UpdatedIntervention session={session} save={save} go={go}/></Suspense>} {page==='ven'&&<UpdatedVen session={session} save={save} go={go}/>} {page==='rhythm'&&<Rhythm go={go} session={session} save={save}/>} {page==='journey'&&<Suspense fallback={null}><Journey go={go}/></Suspense>} {page==='about'&&<About/>}{page==='guide'&&<Guide go={go}/>}{page==='tongket'&&<TongKet session={session} save={save} go={go}/>}<Footer go={go}/></>}
function Footer({go}:{go:(p:Page)=>void}){return <footer className='site-footer'><div className='footer-brand'>CHIẾU CHÈO SƯƠNG OAN</div><p className='footer-tagline'>Một không gian học tập về nghệ thuật truyền thống Việt Nam.</p><nav className='footer-links'><button onClick={()=>go('guide')}>Hướng dẫn</button><button onClick={()=>go('about')}>Về dự án</button><a href='/gioi-thieu#nguon-ghi-nhan'>Nguồn & ghi nhận</a></nav><div className='footer-disclaimers'><p>Nội dung do AI tạo có thể chưa chính xác; hãy đối chiếu nguồn.</p><p>Hình minh họa mang tính giáo dục, không phải tư liệu lưu trữ.</p><p>© [Nội dung cần bổ sung: đơn vị thực hiện / năm / giấy phép]</p></div></footer>}
function UpdatedGame({go,session,save,loading}:{go:(p:Page)=>void;session:GameSession;save:(s:GameSession)=>void;loading:boolean}){
  const [startChapter,setStartChapter]=useState(1)
  const [confirmingReset,setConfirmingReset]=useState(false)
  const [resetToast,setResetToast]=useState(false)

  const begin=()=>save({...blankSession,chapter:startChapter,startedAt:Date.now()})
  const doReset=()=>{
    save(blankSession)
    try{sessionStorage.removeItem(VEN_ROUND_KEY)}catch{}
    setConfirmingReset(false)
    setResetToast(true)
    setTimeout(()=>setResetToast(false),4000)
  }

  const header=<><div className='eyebrow'>CHIẾU CHÈO SƯƠNG OAN <span>COMPANION CHO BỘ GAME VẬT LÝ</span></div><h1>Một câu chuyện<br/><em>nhiều góc nhìn.</em></h1><p className='lead'>Website không thay thế bàn chơi. Nó mở đúng thông tin cho từng thẻ và từng vai trò.</p></>

  if(loading)return <main className='page game-page' aria-busy='true'>{header}<div className='hub-skeleton'><div className='bar short'/><div className='bar'/><div className='bar'/></div></main>

  if(session.finished)return <main className='page game-page'>{header}<div className='hub-stack'>
    <div className='hub-panel'><b>VÁN ĐÃ KẾT THÚC</b><p className='hub-note'>Cảm ơn nhóm đã chơi hết 5 chương.</p><button className='primary' onClick={()=>go('tongket')}>Xem tổng kết <ArrowRight/></button><button className='outline' onClick={()=>setConfirmingReset(true)}>Ván mới</button></div>
  </div>
    {confirmingReset&&<ConfirmDialog title='Bắt đầu ván mới?' body='Điểm Oan, điểm Hiểu Chèo, các lượt AI Vén Màn, Thẻ Can Thiệp đã dùng và kết quả Nhịp–Phách của ván này sẽ bị xóa khỏi máy này. Việc này không hoàn tác được.' confirmLabel='Xóa và bắt đầu lại' cancelLabel='Giữ ván này' onConfirm={doReset} onCancel={()=>setConfirmingReset(false)}/>}
    {resetToast&&<div className='intervention-toast' role='status'>Đã xóa ván. Bắt đầu ván mới.</div>}
  </main>

  if(!session.startedAt)return <main className='page game-page'>{header}<div className='hub-stack'>
    <div className='hub-panel'>
      <b>BẮT ĐẦU VÁN MỚI</b>
      <div className='hub-start'>
        <label htmlFor='hub-start-chapter'>CHỌN CHƯƠNG BẮT ĐẦU</label>
        <select id='hub-start-chapter' value={startChapter} onChange={e=>setStartChapter(Number(e.target.value))}>
          {chapters.map((c,i)=><option key={c} value={i+1}>{`Chương ${i+1} · ${c}`}</option>)}
        </select>
      </div>
      <button className='primary' onClick={begin}>Bắt đầu <ArrowRight/></button>
    </div>
    <button className='text-link' onClick={()=>go('guide')}>Đọc hướng dẫn <ArrowRight/></button>
    <p className='hub-note'>Có thẻ trong tay? Quét QR trên thẻ hoặc nhập mã.</p>
  </div></main>

  const chapterIdx=session.chapter-1
  const chapterHasStory=session.chapter===1
  const chapterCards=storyCards.filter(c=>c.chapter===session.chapter)
  const storyIdx=chapterCards.findIndex(c=>c.id===session.storyId)
  const venLeft=Math.max(2-(session.venAsked[session.chapter]||0),0)
  const continueToStory=chapterHasStory

  return <main className='page game-page'>{header}
    <div className='hub-stack'>
      <div className='hub-panel'>
        <div className='hub-run-status'>
          <span>VÁN ĐANG CHƠI · Bắt đầu {new Date(session.startedAt).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</span>
        </div>
        <div className='chapter-chip'>
          <label htmlFor='hub-chapter'>CHƯƠNG ĐANG CHƠI</label>
          <select id='hub-chapter' value={session.chapter} onChange={e=>save({...session,chapter:Number(e.target.value)})}>
            {chapters.map((c,i)=><option key={c} value={i+1}>{`Chương ${i+1} · ${c}`}</option>)}
          </select>
        </div>
        {!chapterHasStory&&<p className='hub-note' role='status'>Chương này chưa có thẻ trên web. Hãy dùng bộ thẻ vật lý; AI Vén Màn vẫn dùng được cho chương này.</p>}
        <div className='game-stats'><div><b>{session.oan}</b><span>ĐIỂM OAN</span></div><div><b>{session.hieu}</b><span>HIỂU CHÈO</span></div><div><b>{session.usedPerspectives.length}</b><span>LỜI CHỨNG</span></div></div>
        <p className='hub-note'>Sổ điểm trên máy này · Oan càng thấp càng tốt</p>
        <button className='primary' onClick={()=>go(continueToStory?'story':'ven')}>{continueToStory?'Tiếp tục · Thẻ Tích Truyện':'Mở AI Vén Màn'} <ArrowRight/></button>
      </div>

      <div className='hub-panel'>
        <b>BỘ THẺ</b>
        <div className='card-rows'>
          {chapterHasStory&&<button className='card-row' onClick={()=>go('story')}><b>Thẻ Tích Truyện · Người Kể Tích</b><span>{storyIdx>=0?`Thẻ ${storyIdx+1}/${chapterCards.length}${chapterCards[storyIdx]?.type==='oan'?' · có Oan':''}`:`${chapterCards.length} thẻ trong chương`}</span></button>}
          <button className='card-row' onClick={()=>go('perspective')}><b>Thẻ Góc Nhìn · Người Soi Chứng</b><span>Đã mở {session.usedPerspectives.length}/{perspectiveCards.length}</span></button>
          <button className='card-row' onClick={()=>go('intervention')}><b>Thẻ Can Thiệp · Cả nhóm</b><span>Còn {interventionCards.length-session.usedInterventions.length}/{interventionCards.length} thẻ</span></button>
          <button className='card-row' onClick={()=>go('rhythm')}><b>Thẻ Nhịp–Phách · Cả nhóm</b><span>{session.rhythmUsed?`Tốt nhất ${session.rhythmBest}%`:'Chưa thử'}</span></button>
          <button className='card-row' onClick={()=>go('ven')}><b>Thẻ AI Vén Màn · Cả nhóm</b><span>Chương {session.chapter} · còn {venLeft}/2 câu</span></button>
        </div>
      </div>

      <div className='hub-panel'>
        <b>CÔNG CỤ</b>
        <div className='card-rows'>
          <button className='card-row' onClick={()=>go('journey')}><b>Hành trình (52 ô)</b></button>
          <button className='card-row' onClick={()=>go('guide')}><b>Hướng dẫn chơi</b></button>
        </div>
      </div>

      <div className='hub-panel'>
        <b>QUẢN LÝ VÁN</b>
        <div className='hub-manage'>
          <button className='outline' onClick={()=>go('tongket')}>Kết thúc chương {session.chapter}</button>
          <button className='outline' onClick={()=>setConfirmingReset(true)}>Ván mới</button>
        </div>
      </div>
    </div>

    {confirmingReset&&<ConfirmDialog title='Bắt đầu ván mới?' body='Điểm Oan, điểm Hiểu Chèo, các lượt AI Vén Màn, Thẻ Can Thiệp đã dùng và kết quả Nhịp–Phách của ván này sẽ bị xóa khỏi máy này. Việc này không hoàn tác được.' confirmLabel='Xóa và bắt đầu lại' cancelLabel='Giữ ván này' onConfirm={doReset} onCancel={()=>setConfirmingReset(false)}/>}
    {resetToast&&<div className='intervention-toast' role='status'>Đã xóa ván. Bắt đầu ván mới.</div>}
  </main>
}
function TongKet({session,save,go}:{session:GameSession;save:(s:GameSession)=>void;go:(p:Page)=>void}){
  const chapter=session.chapter
  const stats=chapterStats(session,chapter)
  const objective=chapterData.find(c=>c.id===chapter)?.objective
  const isLast=chapter>=5
  const advance=()=>{
    if(isLast){save({...session,finished:true})}
    else{save({...session,chapter:chapter+1})}
    go('game')
  }
  return <main className='page tongket-page'>
    <div className='eyebrow'>TỔNG KẾT · CHƯƠNG {chapter}</div>
    <h1>{chapters[chapter-1]}</h1>
    {objective&&<div className='hub-panel'>
      <b>CÂU HỎI CHO CẢ NHÓM</b>
      <p>{objective}</p>
      <p>Nhóm đã nhận ra điều này chưa?</p>
    </div>}
    <div className='hub-panel'>
      <b>TRONG CHƯƠNG NÀY</b>
      <div className='tongket-stats'>
        <div><b>Điểm Oan</b><span>{stats.oanDelta>0?`+${stats.oanDelta}`:stats.oanDelta}</span></div>
        <div><b>Điểm Hiểu Chèo</b><span>{stats.hieuDelta>0?`+${stats.hieuDelta}`:stats.hieuDelta}</span></div>
        <div><b>Lời chứng đã mở</b><span>{stats.testimonies}</span></div>
        <div><b>AI Vén Màn</b><span>{stats.venAsked}/2 câu</span></div>
        <div><b>Thẻ Can Thiệp</b><span>Dùng {stats.interventionsUsed.length}</span></div>
        <div><b>Nhịp–Phách</b><span>{stats.rhythmTried?`${stats.rhythmBestPct}%`:'Chưa thử'}</span></div>
      </div>
    </div>
    {isLast&&<div className='hub-panel'>
      <b>TOÀN VÁN</b>
      <div className='tongket-stats'>
        <div><b>Điểm Oan</b><span>{session.oan}</span></div>
        <div><b>Điểm Hiểu Chèo</b><span>{session.hieu}</span></div>
        <div><b>Lời chứng đã mở</b><span>{session.usedPerspectives.length}</span></div>
      </div>
    </div>}
    <button className='primary' onClick={advance}>{isLast?'KẾT THÚC VÁN':`SANG CHƯƠNG ${chapter+1} →`}</button>
    <button className='text-link' onClick={()=>go('game')}>Xem lại chương</button>
  </main>
}
function UpdatedStory({card,go}:{card:StoryCard;go:(p:Page)=>void}){return <main className='page story-page'><div className='eyebrow'>THẺ TÍCH TRUYỆN · CHƯƠNG {card.chapter}<span>{card.type==='oan'?'● CÓ TÌNH HUỐNG OAN':'THẺ THƯỜNG'}</span></div><div className={card.type==='oan'?'story-card oan-mark':'story-card'}><span className='story-symbol'>{card.type==='oan'?'O':'T'}</span><h1>{card.title}</h1><p>{card.content}</p>{card.type==='oan'&&<div className='oan-notice'><b>OAN</b><span>Thẻ này mở hệ thống điều tra Góc Nhìn.</span></div>}</div><button className='primary' onClick={()=>card.type==='oan'?go('oan'):go('game')}>{card.type==='oan'?'Mở tình huống Oan':'Tiếp tục câu chuyện'} <ArrowRight/></button><button className='text-link' onClick={()=>go('ven')}>Thẻ AI Vén Màn <Sparkles/></button></main>}
function UpdatedOan({go}:{go:(p:Page)=>void}){return <main className='page oan-page'><button className='back' onClick={()=>go('story')}>← Về Thẻ Tích Truyện</button><div className='oan-card'><div className='eyebrow'>TÌNH HUỐNG OAN · OAN-01</div><h1>Lời truyền<br/><em>ngoài sân.</em></h1><p className='story'>Một lời truyền miệng khiến nhân vật bị nhìn bằng ánh mắt khác. Hãy đọc tình huống trước khi chọn một Thẻ Góc Nhìn.</p><p className='question'>Bạn muốn nhìn sự việc từ góc nhìn của ai?</p><button className='primary' onClick={()=>go('perspective')}>Chọn Thẻ Góc Nhìn <Eye/></button><button className='outline' onClick={()=>go('intervention')}>Xem Thẻ Can Thiệp</button></div></main>}
type PerspectiveError='none'|'too-short'|'not-found'|'wrong-oan'
function UpdatedPerspective({go,session,save}:{go:(p:Page)=>void;session:GameSession;save:(s:GameSession)=>void}){
  const searchParams=useSearchParams()
  const [code,setCode]=useState('')
  const [tried,setTried]=useState(false)
  const [errorType,setErrorType]=useState<PerspectiveError>('none')
  const [result,setResult]=useState<{card:Perspective;evidence:PerspectiveEvidence;reopened:boolean}|null>(null)
  const inputRef=useRef<HTMLInputElement>(null)
  const resultHeadingRef=useRef<HTMLHeadingElement>(null)

  const lookup=(c:string)=>{
    if(c.length<4){setErrorType('too-short');setResult(null);return}
    const card=perspectiveCards.find(x=>x.code===c)
    if(!card){setErrorType('not-found');setResult(null);return}
    const ev=perspectiveEvidence.find(x=>x.cardId===card.id&&x.oanId===session.oanId)
    if(!ev){setErrorType('wrong-oan');setResult(null);return}
    setErrorType('none')
    const key=card.id+session.oanId
    const reopened=session.usedPerspectives.includes(key)
    save(reopened?{...session,lastPerspectiveEffect:ev.effect}:logEvent({...session,usedPerspectives:[...session.usedPerspectives,key],oan:session.oan+ev.effect,lastPerspectiveEffect:ev.effect},{ch:session.chapter,type:'perspective',oanId:session.oanId,cardId:card.id,effect:ev.effect}))
    setResult({card,evidence:ev,reopened})
  }

  useEffect(()=>{
    if(result)resultHeadingRef.current?.focus()
  },[result])

  // Deep link (spec 3.5): a QR-scanned ?ma= is a clear intent to view, so auto-open on load.
  useEffect(()=>{
    const ma=searchParams.get('ma')?.replace(/\D/g,'').slice(0,4)
    if(ma){setCode(ma);if(ma.length===4)lookup(ma)}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const reset=()=>{setCode('');setResult(null);setErrorType('none');setTried(false);inputRef.current?.focus();window.scrollTo({top:0,behavior:'smooth'})}

  return <main className='page perspective-page'>
    <button className='back' onClick={()=>go('oan')}>← Về tình huống Oan</button>
    <div className='eyebrow'>NGƯỜI SOI CHỨNG · THẺ GÓC NHÌN</div>
    <h1>Mở một<br/><em>góc nhìn.</em></h1>
    <div className='code-box'>
      <label htmlFor='perspective-code'>NHẬP MÃ 4 CHỮ SỐ</label>
      <input ref={inputRef} id='perspective-code' inputMode='numeric' maxLength={4} value={code} onChange={e=>{setTried(false);setErrorType('none');setCode(e.target.value.replace(/\D/g,''))}} placeholder='— — — —'/>
      <button className='primary' onClick={()=>{setTried(true);lookup(code)}}>Xem góc nhìn <ArrowRight/></button>
      <small>Mã in trên Thẻ Góc Nhìn.</small>
      {tried&&errorType==='too-short'&&<p className='error'><X/> Nhập đủ 4 chữ số.</p>}
      {errorType==='not-found'&&<p className='error'><X/> Không tìm thấy thẻ có mã này. Kiểm tra lại mã trên thẻ.</p>}
      {errorType==='wrong-oan'&&<p className='error'><X/> Thẻ này không thuộc tình huống hiện tại.</p>}
    </div>
    {result&&<div className='testimony' role='status'>
      <div className='eyebrow'>{result.card.name} · {result.card.role}</div>
      <div className='traits'>{result.card.traits.map(x=><span key={x}>{x}</span>)}</div>
      <h2 ref={resultHeadingRef} tabIndex={-1}>Lời chứng / Thông tin được biết</h2>
      <p>{result.evidence.text}</p>
      <div className='blind-spot'><b>Giới hạn hiểu biết</b><span>{result.card.blindSpot}</span></div>
      <div className={result.evidence.effect<0?'result ok':'result warn'}>
        {result.evidence.effect<0?<Check/>:<TriangleAlert/>}
        <b>{result.evidence.effect<0?'Thông tin này giúp làm rõ một phần sự việc.':result.evidence.effect===0?'Thông tin này chưa đủ để xác định sự việc.':'Thông tin này chưa giúp làm rõ tình huống.'}</b>
        <span className='oan-chip'>Điểm Oan {result.evidence.effect>0?'+':''}{result.evidence.effect}</span>
      </div>
      {result.reopened&&<p className='reopen-note'>Đã ghi nhận trước đó. Không tính điểm lần nữa.</p>}
      <button className='outline' onClick={reset}>Nhập mã khác</button>
    </div>}
  </main>
}
function ConfirmDialog({title,body,confirmLabel,cancelLabel,onConfirm,onCancel}:{title:string;body:React.ReactNode;confirmLabel:string;cancelLabel?:string;onConfirm:()=>void;onCancel:()=>void}){
  const cancelRef=useRef<HTMLButtonElement>(null)
  useEffect(()=>{
    cancelRef.current?.focus()
    const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')onCancel()}
    window.addEventListener('keydown',onKey)
    return ()=>window.removeEventListener('keydown',onKey)
  },[])
  return <div className='dialog-backdrop' onClick={onCancel}>
    <div className='dialog-box' role='dialog' aria-modal='true' aria-labelledby='dialog-title'>
      <h2 id='dialog-title'>{title}</h2>
      <p>{body}</p>
      <div className='dialog-actions'>
        <button ref={cancelRef} className='outline' onClick={onCancel}>{cancelLabel??'Để sau'}</button>
        <button className='primary' onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </div>
  </div>
}
function interventionEffectMessage(id:string,go:(p:Page)=>void):React.ReactNode{
  if(id==='i-01')return 'Đã ghi nhận. Hãy thực hiện trên bàn chơi: nhập thêm một mã Góc Nhìn.'
  if(id==='i-02')return <>Đã thêm 1 lượt thử Nhịp–Phách. <button className='text-link' onClick={()=>go('rhythm')}>Đi tới Nhịp–Phách <ArrowRight/></button></>
  return 'Đã ghi nhận.'
}
function UpdatedIntervention({session,save,go}:{session:GameSession;save:(s:GameSession)=>void;go:(p:Page)=>void}){
  const searchParams=useSearchParams()
  const highlightId=searchParams.get('the')
  const rhythmCard=findRhythmCard('2714')
  const eligibleFor=(id:string)=>id==='i-01'?session.lastPerspectiveEffect!==undefined&&session.lastPerspectiveEffect>=0:id==='i-02'?session.rhythmAttempts>=1&&session.rhythmBest<(rhythmCard?.passAt??80):true
  const [confirming,setConfirming]=useState<Intervention|null>(null)
  const [toast,setToast]=useState<React.ReactNode>(null)
  const cardRefs=useRef<Record<string,HTMLElement|null>>({})

  useEffect(()=>{
    if(highlightId)cardRefs.current[highlightId]?.scrollIntoView({behavior:'smooth',block:'center'})
  },[highlightId])

  const confirmUse=()=>{
    if(!confirming)return
    const c=confirming
    save(logEvent({...session,usedInterventions:[...session.usedInterventions,c.id],interventionLog:{...(session.interventionLog||{}),[c.id]:{at:Date.now(),chapter:session.chapter}}},{ch:session.chapter,type:'intervention',id:c.id}))
    setConfirming(null)
    setToast(interventionEffectMessage(c.id,go))
    setTimeout(()=>setToast(null),6000)
  }

  return <main className='page intervention-page'>
    <button className='back' onClick={()=>go('game')}>← Về game hub</button>
    <div className='eyebrow'>THẺ CAN THIỆP <span>NGUỒN LỰC CHIẾN THUẬT</span></div>
    <h1>Nhóm vẫn có<br/><em>quyền lựa chọn.</em></h1>
    {toast&&<div className='intervention-toast' role='status'>{toast}</div>}
    <div className='intervention-grid'>{interventionCards.map(c=>{
      const used=session.usedInterventions.includes(c.id)
      const eligible=eligibleFor(c.id)
      const usedAt=session.interventionLog?.[c.id]
      return <article ref={el=>{cardRefs.current[c.id]=el}} className={`${used?'used':''}${highlightId===c.id?' highlighted':''}`} key={c.id}>
        <div className='card-top'>
          <b>{c.name}</b>
          {used?<span className='chip'>ĐÃ DÙNG</span>:eligible?<span className='chip chip-ok'>Đủ điều kiện</span>:<span className='chip chip-warn'>Chưa đủ điều kiện theo ghi nhận trên máy này</span>}
        </div>
        <p>{c.description}</p>
        <div className='intervention-meta'>
          <div><b>Điều kiện</b><span>{c.condition}</span></div>
          <div><b>Thời điểm</b><span>{c.timing}</span></div>
          <div><b>Hiệu ứng</b><span>{c.effect}</span></div>
        </div>
        {used
          ?<small className='used-at'>Đã dùng lúc {usedAt?new Date(usedAt.at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}):'--:--'} · Chương {usedAt?.chapter??session.chapter}</small>
          :<button className='primary' onClick={()=>setConfirming(c)}>Dùng thẻ</button>}
      </article>
    })}</div>
    {confirming&&<ConfirmDialog
      title={`Dùng thẻ "${confirming.name}"?`}
      body={<>Thẻ chỉ dùng được 1 lần trong ván.{!eligibleFor(confirming.id)&&<><br/><br/>Điều kiện chưa khớp với ghi nhận trên máy này. Vẫn dùng?</>}</>}
      confirmLabel='Dùng thẻ'
      cancelLabel='Để sau'
      onConfirm={confirmUse}
      onCancel={()=>setConfirming(null)}
    />}
  </main>
}
type VenEvidence={text:string;correct:boolean}
type VenRound={answer:string;evidences:VenEvidence[]}
const VEN_MAX_QUESTIONS=2
const VEN_ROUND_KEY='ccts-ven-round'
const VEN_SLOW_MS=8000
const VEN_TIMEOUT_MS=45000
type StoredVenRound={chapter:number;question:string;round:VenRound;picked:number[]}
function UpdatedVen({session,save,go}:{session:GameSession;save:(s:GameSession)=>void;go:(p:Page)=>void}){
  const chapter=session.chapter
  const asked=session.venAsked[chapter]||0
  const left=VEN_MAX_QUESTIONS-asked
  const [question,setQuestion]=useState('')
  const [loading,setLoading]=useState(false)
  const [slow,setSlow]=useState(false)
  const [notice,setNotice]=useState('')
  const [noticeType,setNoticeType]=useState<'none'|'network'|'refused'>('none')
  const [round,setRound]=useState<VenRound|null>(null)
  const [roundChapter,setRoundChapter]=useState<number|null>(null)
  const [picked,setPicked]=useState<number[]>([])
  const [revealed,setRevealed]=useState(false)
  const [restoredNotice,setRestoredNotice]=useState(false)
  const midRound=(!!round&&!revealed)||loading
  const win=!!round&&picked.length===2&&picked.every(i=>round.evidences[i].correct)
  const displayChapter=roundChapter??chapter

  useEffect(()=>{
    try{
      const raw=sessionStorage.getItem(VEN_ROUND_KEY)
      if(raw){
        const stored:StoredVenRound=JSON.parse(raw)
        setRound(stored.round)
        setPicked(stored.picked||[])
        setQuestion(stored.question)
        setRoundChapter(stored.chapter)
        setRestoredNotice(true)
      }
    }catch{}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const persistRound=(next:StoredVenRound)=>{try{sessionStorage.setItem(VEN_ROUND_KEY,JSON.stringify(next))}catch{}}
  const clearStoredRound=()=>{try{sessionStorage.removeItem(VEN_ROUND_KEY)}catch{}}

  const reset=()=>{setQuestion('');setNotice('');setNoticeType('none');setRound(null);setRoundChapter(null);setPicked([]);setRevealed(false);setRestoredNotice(false);clearStoredRound()}
  const ask=async()=>{
    setLoading(true)
    setSlow(false)
    setNotice('')
    setNoticeType('none')
    const slowTimer=setTimeout(()=>setSlow(true),VEN_SLOW_MS)
    const controller=new AbortController()
    const timeoutTimer=setTimeout(()=>controller.abort(),VEN_TIMEOUT_MS)
    try{
      const response=await fetch('/api/ven',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,chapter}),signal:controller.signal})
      const data=await response.json()
      if(data.verdict==='ok'){
        // Deduct the moment the server says ok, not at reveal -- reveal-time deduction let a reload
        // after seeing the 4 evidences dodge the per-chapter limit (spec 5.6).
        save({...session,venAsked:{...session.venAsked,[chapter]:asked+1}})
        const newRound:VenRound={answer:data.answer,evidences:data.evidences}
        setRound(newRound)
        setRoundChapter(chapter)
        setPicked([])
        setRevealed(false)
        persistRound({chapter,question,round:newRound,picked:[]})
      }else if(data.verdict==='off_topic'||data.verdict==='inappropriate'){
        setNoticeType('refused')
        setNotice(data.message||'Câu hỏi chưa phù hợp. Hãy đặt lại câu hỏi khác.')
      }else{
        setNoticeType('network')
        setNotice(data.message||data.error||'Không thể kết nối AI lúc này.')
      }
    }catch(err){
      setNoticeType('network')
      setNotice((err as {name?:string})?.name==='AbortError'?'AI phản hồi quá chậm.':'Không thể kết nối AI lúc này.')
    }finally{
      clearTimeout(slowTimer)
      clearTimeout(timeoutTimer)
      setLoading(false)
      setSlow(false)
    }
  }
  const toggle=(i:number)=>setPicked(p=>{
    const next=p.includes(i)?p.filter(n=>n!==i):p.length<2?[...p,i]:p
    if(round)persistRound({chapter:displayChapter,question,round,picked:next})
    return next
  })
  const reveal=()=>{
    save(logEvent({...session,hieu:session.hieu+(win?1:0)},{ch:displayChapter,type:'ven',win}))
    setRevealed(true)
    clearStoredRound()
  }
  const clearRefusal=()=>{setNotice('');setNoticeType('none')}

  return <main className='page ven-page'>
    <button className='back' onClick={()=>go('game')}>← Về game hub</button>
    <div className='eyebrow'>THẺ AI VÉN MÀN <span>CHƯƠNG {displayChapter} · CÒN {Math.max(left,0)}/{VEN_MAX_QUESTIONS} CÂU HỎI</span></div>
    <h1>Đừng nhận<br/><em>đáp án ngay.</em></h1>
    <div className='chapter-chip'>
      <label htmlFor='ven-chapter'>CHƯƠNG ĐANG CHƠI</label>
      <select id='ven-chapter' value={chapter} disabled={midRound} onChange={e=>{save({...session,chapter:Number(e.target.value)});reset()}}>
        {chapters.map((c,i)=><option key={c} value={i+1}>{`Chương ${i+1} · ${c}`}</option>)}
      </select>
      {midRound&&<span className='chapter-locked-hint'>Kết thúc vòng để đổi chương</span>}
    </div>
    {restoredNotice&&round&&!revealed&&<p className='ven-notice ven-notice-info' role='status'>Đang tiếp tục vòng hỏi trước.</p>}
    {!round&&(left<=0?
      <div className='locked-panel'><LockKeyhole/><h2>Đã dùng hết lượt hỏi</h2><p>Đã dùng hết lượt hỏi của chương này. Hãy chọn chương khác khi nhóm chơi sang chương mới.</p></div>
    :
      <>
        <p className='lead'>Đặt một câu hỏi về cốt truyện, nhân vật hoặc chi tiết của chương này, hoặc về nghệ thuật chèo. AI sẽ không trả lời ngay mà đưa ra các bằng chứng để nhóm tự suy luận.</p>
        <div className='ven-question' aria-busy={loading}>
          <textarea value={question} maxLength={300} onChange={e=>setQuestion(e.target.value)} placeholder='Câu hỏi của nhóm...' disabled={loading}/>
          <span>{question.length}/300</span>
        </div>
        {noticeType==='network'&&<p className='ven-notice ven-notice-danger' role='alert'>{notice} <button className='text-link' onClick={ask}>Thử lại</button></p>}
        {noticeType==='refused'&&<p className='ven-notice ven-notice-warn'>{notice} <button className='text-link' onClick={clearRefusal}>Đặt lại câu hỏi</button></p>}
        {loading&&slow&&<p className='ven-notice ven-notice-info' aria-live='polite'>AI cần thêm chút thời gian, xin đừng đóng trang.</p>}
        <button className='primary' disabled={question.trim().length<2||loading} onClick={ask}>{loading?'AI đang suy nghĩ...':'Vén màn'} <Sparkles/></button>
      </>
    )}
    {round&&!revealed&&<>
      <div className='evidence-list'>
        <p className='ven-hint'><b>Câu hỏi của nhóm:</b> {question}</p>
        <p className='ven-hint'>AI chưa trả lời ngay. Hãy chọn đúng 2 bằng chứng giúp nhóm tìm ra câu trả lời ({picked.length}/2).</p>
        {round.evidences.map((e,i)=><button className={picked.includes(i)?'picked':''} aria-pressed={picked.includes(i)} key={i} onClick={()=>toggle(i)}><span>{picked.includes(i)?<Check/>:String.fromCharCode(65+i)}</span>{e.text}</button>)}
      </div>
      <div className='ven-sticky-bar'><button className='primary' disabled={picked.length!==2} onClick={reveal}>Xem câu trả lời <ArrowRight/></button></div>
    </>}
    {round&&revealed&&<div className='ven-result'>
      <strong>{win?'CHỌN ĐÚNG · +1 ĐIỂM HIỂU CHÈO':'CHƯA ĐÚNG · KHÔNG CÓ ĐIỂM HIỂU CHÈO'}</strong>
      <ul className='ven-review'>{round.evidences.map((e,i)=><li className={`${e.correct?'correct':'wrong'}${picked.includes(i)?' chosen':''}`} key={i}><span>{e.correct?'Bằng chứng đúng':'Gây nhiễu'}{picked.includes(i)?' · nhóm đã chọn':''}</span>{e.text}</li>)}</ul>
      <h2>Câu trả lời của AI Vén Màn</h2>
      <div className='ven-answer'><ReactMarkdown>{round.answer}</ReactMarkdown></div>
      <small className='ven-disclaimer'>Nội dung do AI tạo, có thể chưa chính xác.</small>
      <div className='ven-actions'>
        {left>0&&<button className='primary' onClick={reset}>Đặt câu hỏi tiếp ({left} lượt còn lại)</button>}
        <button className='outline-light' onClick={()=>go('game')}>Về game hub</button>
      </div>
    </div>}
  </main>
}
function LegacyApp(){const [page,setPage]=useState<Page>("home"),[query,setQuery]=useState(""),[filter,setFilter]=useState("Tất cả"),[selected,setSelected]=useState(arts[0]),[menu,setMenu]=useState(false),[code,setCode]=useState(""),[codeState,setCodeState]=useState("idle"),[qa,setQa]=useState(""),[answer,setAnswer]=useState(""),[question,setQuestion]=useState(""),[picked,setPicked]=useState<string[]>([]),[venDone,setVenDone]=useState(false),[step,setStep]=useState(0);const visible=useMemo(()=>arts.filter(a=>(filter==="Tất cả"||a.category===filter)&&(!query||`${a.name} ${a.region} ${a.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()))),[query,filter]);const go=(p:Page)=>{setPage(p);setMenu(false);window.scrollTo({top:0,behavior:"smooth"})};return <><header className="topbar"><button className="brand" onClick={()=>go("home")}><span>CHIẾU CHÈO</span><b>SƯƠNG OAN</b></button><nav><button onClick={()=>go("game")}>Khám phá di sản</button><button onClick={()=>go("game")}>Chiếu Chèo Sương Oan</button><button onClick={()=>go("qa")}>AI Hỏi Đáp</button><button onClick={()=>go("journey")}>Hành trình</button><button onClick={()=>go("about")}>Về dự án</button></nav><button className="menu-button" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></header>{menu&&<div className="mobile-menu"><button onClick={()=>go("game")}>Khám phá di sản</button><button onClick={()=>go("game")}>Chiếu Chèo Sương Oan</button><button onClick={()=>go("qa")}>AI Hỏi Đáp</button><button onClick={()=>go("journey")}>Hành trình</button><button onClick={()=>go("about")}>Về dự án</button></div>}{page==="home"&&<Home go={go}/>} {page==="archive"&&<Archive query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} visible={visible} open={a=>{setSelected(a);go("article")}}/>} {page==="article"&&<Article art={selected} go={go}/>} {page==="qa"&&<QA/>} {page==="game"&&<Game go={go} step={step} setStep={setStep}/>} {page==="oan"&&<Oan code={code} setCode={setCode} state={codeState} validate={()=>setCodeState(code==="1842"?"ok":"bad")} go={go}/>} {page==="ven"&&<Ven question={question} setQuestion={setQuestion} picked={picked} setPicked={setPicked} done={venDone} submit={()=>setVenDone(true)} go={go}/>} {page==="journey"&&<Journey go={go}/>} {page==="rhythm"&&<Rhythm go={go}/>} {page==="about"&&<About/>}<footer><span>CHIẾU CHÈO SƯƠNG OAN</span><small>Một không gian học tập về nghệ thuật truyền thống Việt Nam</small></footer></>}
function Home({go}:{go:(p:Page)=>void}){return <main className="home"><section className="stage-hero"><div className="stage-image"><img src="/images/cheo-stage-illustration.png" alt="Sân khấu Chèo với rèm đỏ, mái đình và nhạc cụ truyền thống"/></div><div className="stage-ornament top" aria-hidden="true">✦　❖　✦</div><div className="hero-copy stage-title"><div className="eyebrow">HÀNH TRÌNH THỊ KÍNH <span>OAN · NHẪN · GIÁC</span></div><h1>CHIẾU CHÈO<br/><em>SƯƠNG OAN</em></h1><p>Ai đang kể câu chuyện này? Vén màn, tìm bằng chứng và tự mình kết luận.</p><div className="actions"><button className="primary" onClick={()=>go("game")}>TRẢI NGHIỆM GAME <ArrowRight/></button><button className="stage-link" onClick={()=>go("qa")}>HỎI AI <Sparkles/></button></div></div><div className="stage-prop left" aria-hidden="true">☊</div><div className="stage-prop right" aria-hidden="true">♢</div><div className="stage-ornament bottom" aria-hidden="true">❧　❧　❧</div></section><div className="curtain-divider" aria-hidden="true"><span>✦</span><i/><span>❖</span><i/><span>✦</span></div><section className="door-section"><div className="section-heading"><span className="eyebrow">HAI CÁNH CỬA</span><h2>Chọn cách<br/><em>bước vào.</em></h2></div><div className="door-panels"><button className="door-panel question-door" onClick={()=>go('qa')}><span className="card-number">CỬA 01</span><span className="door-symbol">?</span><strong>AI HỎI ĐÁP</strong><small>Hỏi về nghệ thuật truyền thống Việt Nam</small><ArrowRight/></button><button className="door-panel game-door" onClick={()=>go('game')}><span className="card-number">CỬA 02</span><span className="door-symbol">◉</span><strong>CHIẾU CHÈO<br/>SƯƠNG OAN</strong><small>Đi vào hành trình Thị Kính</small><ArrowRight/></button></div></section><section className="card-archive"><div className="section-heading"><span className="eyebrow">BỘ THẺ ĐIỆN TỬ</span><h2>Những gì nằm<br/><em>trên bàn chơi.</em></h2></div><div className="physical-cards"><button className="physical-card" onClick={()=>go('story')}><span className="card-number">01 · CHIẾU CHÈO</span><b className="card-mark">✦</b><strong>TÍCH TRUYỆN</strong><small>Mở cảnh</small><span className="card-rule"/></button><button className="physical-card" onClick={()=>go('oan')}><span className="card-number">02 · CHIẾU CHÈO</span><b className="card-mark">O</b><strong>OAN</strong><small>Dừng lại để hỏi</small><span className="card-rule"/></button><button className="physical-card" onClick={()=>go('perspective')}><span className="card-number">03 · CHIẾU CHÈO</span><b className="card-mark">◌</b><strong>GÓC NHÌN</strong><small>Đọc lời chứng</small><span className="card-rule"/></button><button className="physical-card" onClick={()=>go('ven')}><span className="card-number">04 · CHIẾU CHÈO</span><b className="card-mark">✦</b><strong>AI VÉN MÀN</strong><small>Mở bằng chứng</small><span className="card-rule"/></button><button className="physical-card" onClick={()=>go('rhythm')}><span className="card-number">05 · CHIẾU CHÈO</span><b className="card-mark">♩</b><strong>NHỊP–PHÁCH</strong><small>Giữ nhịp sân khấu</small><span className="card-rule"/></button></div></section><section className="home-intro"><div><span className="section-number">01 /</span><h2>Một câu chuyện.<br/><em>Nhiều cách nhìn.</em></h2></div><p>Website không thay thế bàn chơi vật lý. Nó mở đúng thông tin ở đúng thời điểm để nhóm có thể nhìn sự việc chậm hơn, rộng hơn và có căn cứ hơn.</p></section><section className="feature-grid">{[["Hành trình","Năm chương như năm cảnh sân khấu","journey"],["Góc Nhìn","Mỗi nhân vật thấy một phần sự việc","perspective"],["Kiểm chứng","Đọc tình huống Oan, nhập mã, đọc lời chứng","oan"],["AI Vén Màn","Đặt câu hỏi, tìm bằng chứng","ven"]].map(([title,copy,target],i)=><button className="feature-card" key={title} onClick={()=>go(target as Page)}><span>0{i+1}</span><strong>{title}</strong><small>{copy}</small><ArrowRight/></button>)}</section><section className="home-callout"><Sparkles/><div><span className="eyebrow">ĐIỂM BẮT ĐẦU</span><h2>Vén màn một<br/><em>câu chuyện.</em></h2></div><button className="primary" onClick={()=>go("ven")}>AI Vén Màn <ArrowRight/></button></section><section className="act-strip"><div><span className="section-number">02 /</span><h2>Thị Kính · Oan<br/><em>Nhẫn · Giác</em></h2></div><p>Bốn từ khóa đi cùng một hành trình: nhìn thấy, nhận ra điều chưa công bằng, giữ được lòng nhẫn nại và tự mình giác ngộ.</p></section><section className="chapter-overview"><div className="section-heading"><span className="eyebrow">NĂM CHƯƠNG · NĂM CẢNH</span><h2>Từ sân đình<br/><em>đến giác ngộ.</em></h2></div><div className="chapter-line">{chapters.map((name,i)=><a key={name} href={`/hanh-trinh?chuong=${i+1}`}><span>{String(i+1).padStart(2,'0')}</span><b>{name}</b><small>{i===0?'Mở màn':i===4?'Khép lại':'Tiếp diễn'}</small></a>)}</div></section><section className="investigation-teaser"><div className="investigation-copy"><span className="eyebrow">NGƯỜI SOI CHỨNG</span><h2>Không chọn<br/><em>người đúng.</em></h2><p>Mở một Thẻ Góc Nhìn để biết nhân vật ấy thấy gì, không thấy gì, và lời chứng đó giúp nhóm đi xa đến đâu.</p><button className="text-link" onClick={()=>go('perspective')}>Thử một Thẻ Góc Nhìn <ArrowRight/></button></div><div className="perspective-stack"><div className="perspective-card back"><span>THẺ GÓC NHÌN</span><b>?</b></div><div className="perspective-card front"><span>BÁC ĐỘ · 1842</span><h3>Người giữ trống làng</h3><p>Nhớ trình tự. Không nghe được mọi lời.</p></div></div></section></main>}
function Archive({query,setQuery,filter,setFilter,visible,open}:{query:string;setQuery:(s:string)=>void;filter:string;setFilter:(s:string)=>void;visible:Art[];open:(a:Art)=>void}){return <main className="page archive"><div className="eyebrow">KHÁM PHÁ DI SẢN <span>{arts.length} HỒ SƠ</span></div><h1>Mỗi vùng đất<br/><em>một cách kể.</em></h1><div className="search-row"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm theo tên, vùng miền, khái niệm..."/></div><div className="filter-row">{filters.map(f=><button className={filter===f?"selected":""} onClick={()=>setFilter(f)} key={f}>{f}</button>)}</div><p className="result-count">{visible.length} hồ sơ phù hợp</p><div className="archive-grid">{visible.map((a,i)=><button className="archive-card" onClick={()=>open(a)} key={a.id}><div className="archive-image"><img src={a.image} alt=""/><span>{String(i+1).padStart(2,"0")}</span></div><small>{a.category} · {a.region}</small><h3>{a.name}</h3><p>{a.summary}</p><div className="tags">{a.tags.map(t=><span key={t}>{t}</span>)}</div></button>)}</div></main>}
function Article({art,go}:{art:Art;go:(p:Page)=>void}){const [tab,setTab]=useState("Tổng quan"),tabs=["Tổng quan","Đặc trưng","Âm nhạc","Vai diễn","Giá trị văn hóa"];return <main className="page article"><button className="back" onClick={()=>go("game")}>← Quay lại kho lưu trữ</button><div className="article-head"><div><div className="eyebrow">HỒ SƠ DI SẢN · {art.region}</div><h1>{art.name}</h1><p>{art.summary}</p></div><div className="article-meta"><span>THỜI KỲ</span><b>{art.period}</b><span>THỂ LOẠI</span><b>{art.category}</b></div></div><div className="article-gallery"><figure><img src={art.image} alt={`Tư liệu minh họa ${art.name}`}/><figcaption>Hình ảnh minh họa giáo dục · Không phải tư liệu lưu trữ</figcaption></figure><figure><img src="/images/heritage-gallery-2.png" alt="Nhạc cụ truyền thống"/><figcaption>Không gian âm nhạc</figcaption></figure><figure><img src="/images/heritage-gallery-1.png" alt="Trang phục biểu diễn"/><figcaption>Ngôn ngữ sân khấu</figcaption></figure></div><div className="article-tabs">{tabs.map(t=><button className={tab===t?"active":""} onClick={()=>setTab(t)} key={t}>{t}</button>)}</div><section className="article-body"><div><h2>{tab}</h2><p>{tab==="Tổng quan"?art.summary:`${art.name} được nhận diện qua ${art.concepts.join(", ")}. Những yếu tố này tạo nên một ngôn ngữ nghệ thuật riêng, cần được đọc trong đúng không gian và cộng đồng thực hành.`}</p><div className="info-columns"><div><span>KHÁI NIỆM</span><ul>{art.concepts.map(x=><li key={x}>{x}</li>)}</ul></div><div><span>NHẠC CỤ / YẾU TỐ</span><ul>{art.instruments.map(x=><li key={x}>{x}</li>)}</ul></div><div><span>TÁC PHẨM / HÌNH THỨC</span><ul>{art.works.map(x=><li key={x}>{x}</li>)}</ul></div></div></div><aside className="source-note"><BookOpen/><div><span>NGUỒN THAM KHẢO</span><p>{art.source}</p><small>Nội dung mô phỏng cho prototype giáo dục; cần đối chiếu với tư liệu chuyên ngành khi xuất bản.</small></div></aside></section><div className="related-game"><span>LIÊN HỆ VỚI BỘ GAME</span><p>Tìm hiểu cách sân khấu, góc nhìn và lời kể giúp ta đọc một tình huống nhiều chiều.</p><button className="text-link" onClick={()=>go("game")}>Mở companion <ArrowRight/></button></div></main>}
type ChatMessage={role:'user'|'assistant';content:string;sources?:{title:string;url:string}[]}
function QA(){
  const [messages,setMessages]=useState<ChatMessage[]>([])
  const [input,setInput]=useState('')
  const [loading,setLoading]=useState(false)
  const endRef=useRef<HTMLDivElement>(null)
  const suggestions=["Chèo khác Tuồng như thế nào?","Vai diễn ước lệ là gì?","Vì sao sân khấu cần âm nhạc?"]

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'})},[messages,loading])

  const send=async(text:string)=>{
    const q=text.trim()
    if(!q||loading)return
    setMessages(m=>[...m,{role:'user',content:q}])
    setInput('')
    setLoading(true)
    try{
      const response=await fetch("/api/ask",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:q})})
      const data=await response.json()
      setMessages(m=>[...m,{role:'assistant',content:data.answer||data.message||data.error||'Không có phản hồi.',sources:data.sources}])
    }catch{
      setMessages(m=>[...m,{role:'assistant',content:'Không thể kết nối AI lúc này.'}])
    }finally{
      setLoading(false)
    }
  }

  return <main className="page qa-page qa-chat">
    <div className="chat-window">
      {messages.length===0?
        <div className="chat-welcome">
          <Sparkles/>
          <h1>AI Hỏi Đáp Di Sản</h1>
          <p>Một trợ lý học tập ưu tiên nguồn đã kiểm chứng về nghệ thuật truyền thống Việt Nam.</p>
          <div className="chat-suggestions">{suggestions.map(s=><button key={s} onClick={()=>send(s)}>{s}<ArrowRight/></button>)}</div>
        </div>
      :
        <div className="chat-messages">
          {messages.map((m,i)=><div className={`chat-bubble ${m.role}`} key={i}>
            <span className="chat-bubble-icon">{m.role==='user'?'B':<Sparkles/>}</span>
            <div className="chat-bubble-content">
              {m.role==='assistant'?<ReactMarkdown>{m.content}</ReactMarkdown>:<p>{m.content}</p>}
              {m.sources&&m.sources.length>0&&<div className="chat-sources">Nguồn: {m.sources.map(s=><a href={s.url} target="_blank" rel="noreferrer" key={s.title}>{s.title}</a>)}</div>}
            </div>
          </div>)}
          {loading&&<div className="chat-bubble assistant"><span className="chat-bubble-icon"><Sparkles/></span><div className="chat-bubble-content chat-typing"><span/><span/><span/></div></div>}
          <div ref={endRef}/>
        </div>
      }
    </div>
    <div className="chat-input-bar">
      <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(input)}}} placeholder="Nhập câu hỏi về nghệ thuật truyền thống Việt Nam..." disabled={loading}/>
      <button className="chat-send" onClick={()=>send(input)} disabled={loading||!input.trim()} aria-label="Gửi câu hỏi"><ArrowRight/></button>
    </div>
  </main>
}
function Game({go,step,setStep}:{go:(p:Page)=>void;step:number;setStep:(n:number)=>void}){return <main className="page game-page"><div className="eyebrow">CHIẾU CHÈO SƯƠNG OAN <span>COMPANION CHO BỘ GAME VẬT LÝ</span></div><h1>Một câu chuyện<br/><em>nhiều góc nhìn.</em></h1><p className="lead">Website không thay thế bàn chơi. Nó mở thêm bối cảnh, lưu lại hành trình và giúp cả nhóm cùng đọc một tình huống.</p><div className="chapter-picker"><span>CHƯƠNG ĐANG CHƠI</span>{chapters.map((c,i)=><button className={step===i?"selected":""} onClick={()=>setStep(i)} key={c}>Chương {i+1}<small>{c}</small></button>)}</div><div className="game-grid"><div className="game-panel"><span className="eyebrow">BẮT ĐẦU TỪ VẬT PHẨM TRÊN BÀN</span><h2>Quét Thẻ Oan</h2><p>Đưa camera vào mã QR trên lá bài. Màn hình tình huống sẽ mở đúng chương và đúng câu chuyện.</p><button className="primary" onClick={()=>go("oan")}>Mở mô phỏng QR <ArrowRight/></button></div><div className="game-panel dark"><span className="eyebrow">MỘT LẦN MỖI CHƯƠNG</span><h2>AI Vén Màn</h2><p>Đặt câu hỏi, chọn bằng chứng, rồi xem cách câu chuyện được giải thích.</p><button className="outline-light" onClick={()=>go("ven")}>Vén màn chương {step+1} <Sparkles/></button><button className="text-link" onClick={()=>go("rhythm")}>Thử Nhịp–Phách <ArrowRight/></button></div></div></main>}
function Oan({code,setCode,state,validate,go}:{code:string;setCode:(s:string)=>void;state:string;validate:()=>void;go:(p:Page)=>void}){return <main className="page oan-page"><button className="back" onClick={()=>go("game")}>← Về game hub</button><div className="oan-card"><div className="eyebrow">THẺ OAN · CHƯƠNG I <span>OAN-01</span></div><h1>Tiếng gọi<br/><em>ngoài sân.</em></h1><p className="story">Trong một buổi diễn, một lời truyền miệng khiến nhân vật bị nhìn bằng ánh mắt khác. Hãy đọc tình huống trên Thẻ Oan trước khi tìm góc nhìn phù hợp.</p><div className="code-field"><label>MÃ GÓC NHÌN</label><input inputMode="numeric" maxLength={4} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,""))} placeholder="— — — —"/><button className="primary" onClick={validate}>Kiểm tra mã <ArrowRight/></button></div>{state!=="idle"&&<div className={`result ${state}`}>{state==="ok"?<><Check/><strong>GIẢI OAN THÀNH CÔNG</strong><p>Góc nhìn phù hợp. Oan không bị trừ.</p></>:<><X/><strong>GÓC NHÌN CHƯA PHÙ HỢP</strong><p>Thử xem lại tình huống và góc nhìn của nhân vật.</p></>}</div>}<small className="privacy">Mã từ chương khác không thể giải tình huống này.</small></div></main>}
function Ven({question,setQuestion,picked,setPicked,done,submit,go}:{question:string;setQuestion:(s:string)=>void;picked:string[];setPicked:(s:string[])=>void;done:boolean;submit:()=>void;go:(p:Page)=>void}){const evidence=["Lời kể của người trong cuộc","Âm thanh sau tấm màn","Lời đồn ở đầu làng","Động tác trên chiếu"];return <main className="page ven-page"><button className="back" onClick={()=>go("game")}>← Về game hub</button><div className="eyebrow">AI VÉN MÀN · CHƯƠNG I <span>{done?"ĐÃ DÙNG":"1 / 1 LƯỢT"}</span></div><h1>Đừng hỏi<br/><em>đáp án ngay.</em></h1>{!done?<><p className="lead">Đặt một câu hỏi. Sau đó chọn những mảnh bằng chứng giúp bạn tự nhìn ra câu trả lời.</p><div className="ven-question"><textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Tại sao nhân vật lại bị hiểu lầm?"/><span>{question.length}/140</span></div><div className="evidence-list">{evidence.map((e,i)=><button className={picked.includes(String(i))?"picked":""} onClick={()=>setPicked(picked.includes(String(i))?picked.filter(x=>x!==String(i)):[...picked,String(i)])} key={e}><span>{picked.includes(String(i))?<Check/>:String.fromCharCode(65+i)}</span><div><b>{e}</b><p>Chi tiết được truy xuất từ dữ liệu tình huống của chương hiện tại.</p></div></button>)}</div><button className="primary" disabled={!question||!picked.length} onClick={submit}>Đánh giá bằng chứng <ArrowRight/></button></>:<div className="ven-result"><div className="result ok"><Check/><strong>VÉN MÀN THÀNH CÔNG</strong><p>Bạn đã tìm đúng những bằng chứng quan trọng.</p></div><h2>Vì sao nhân vật bị hiểu lầm?</h2><p>Những chi tiết từ người trong cuộc và ngôn ngữ sân khấu giúp ta nhận ra điều nhân vật thực sự đang cố bảo vệ.</p><small>Nguồn: dữ liệu tình huống OAN-01 · Giải thích mô phỏng có kiểm soát</small></div>}</main>}
function beatLabel(b:{e:number;dev:number;label:BeatLabel}){
  const dev=Math.round(b.dev)
  const sign=dev>=0?'+':''
  if(b.label==='moc')return{icon:null,text:'Mốc'}
  if(b.label==='dung')return{icon:<Check/>,text:`Đúng phách (${sign}${dev}ms)`}
  if(b.label==='som')return{icon:<TriangleAlert/>,text:`Hơi sớm (${sign}${dev}ms)`}
  if(b.label==='muon')return{icon:<TriangleAlert/>,text:`Hơi muộn (${sign}${dev}ms)`}
  return{icon:<X/>,text:`Lệch nhiều (${sign}${dev}ms)`}
}
function Rhythm({go,session,save}:{go:(p:Page)=>void;session:GameSession;save:(s:GameSession)=>void}){
  const [code,setCode]=useState("")
  const [activeCode,setActiveCode]=useState<string|null>(null)
  const [phase,setPhase]=useState<'entry'|'ready'|'playing'|'your-turn'|'result'>('entry')
  const [taps,setTaps]=useState<number[]>([])
  const [litIndex,setLitIndex]=useState(-1)
  const [soundOn,setSoundOn]=useState(true)
  const [result,setResult]=useState<RhythmResult|null>(null)
  const [practice,setPractice]=useState(false)
  const [notice,setNotice]=useState('')
  const audioCtxRef=useRef<AudioContext|null>(null)
  const lastTapRef=useRef(0)
  const timersRef=useRef<ReturnType<typeof setTimeout>[]>([])
  const silenceTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null)
  const card=activeCode?findRhythmCard(activeCode):undefined

  useEffect(()=>()=>{timersRef.current.forEach(clearTimeout);if(silenceTimerRef.current)clearTimeout(silenceTimerRef.current);audioCtxRef.current?.close?.()},[])

  const begin=()=>{if(findRhythmCard(code)){setActiveCode(code);setPhase('ready')}}

  const ensureAudio=()=>{
    if(!soundOn)return null
    if(!audioCtxRef.current){
      try{const Ctor=window.AudioContext||(window as any).webkitAudioContext;audioCtxRef.current=new Ctor()}catch{return null}
    }
    return audioCtxRef.current
  }

  // ponytail: visual beat timing uses setTimeout (not a full requestAnimationFrame scheduler) --
  // drift is imperceptible over a ~1.7s pattern; upgrade if longer/faster patterns are added later.
  const playPattern=()=>{
    if(!card)return
    setPhase('playing')
    setLitIndex(-1)
    const ctx=ensureAudio()
    if(ctx&&ctx.state!=='running')ctx.resume?.()
    const base=ctx?ctx.currentTime+0.05:0
    card.beats.forEach((t,i)=>{
      if(ctx){
        const osc=ctx.createOscillator();const gain=ctx.createGain()
        osc.type='square';osc.frequency.value=880
        gain.gain.setValueAtTime(0.0001,base+t/1000)
        gain.gain.linearRampToValueAtTime(0.18,base+t/1000+0.005)
        gain.gain.linearRampToValueAtTime(0.0001,base+t/1000+0.06)
        osc.connect(gain).connect(ctx.destination)
        osc.start(base+t/1000);osc.stop(base+t/1000+0.07)
      }
      timersRef.current.push(setTimeout(()=>{setLitIndex(i);navigator.vibrate?.(30)},t))
    })
    timersRef.current.push(setTimeout(()=>{setLitIndex(-1);setPhase('your-turn')},card.beats[card.beats.length-1]+350))
  }

  const abortTap=()=>{
    setTaps([])
    setNotice('Nhịp bị ngắt. Thử lại, lượt này không bị tính.')
    timersRef.current.push(setTimeout(()=>setNotice(''),3000))
  }

  const finish=(rawTaps:number[])=>{
    if(!card)return
    const r=scoreRhythm(card.beats,rawTaps,card.perfectMs,card.zeroMs)
    if(!practice){
      const prevAwarded=rhythmAwarded(session.rhythmBest,card)
      const newAwarded=rhythmAwarded(r.pct,card)
      const delta=Math.max(0,newAwarded-prevAwarded)
      save(logEvent({...session,rhythmAttempts:session.rhythmAttempts+1,rhythmBest:Math.max(session.rhythmBest,r.pct),rhythmUsed:true,hieu:session.hieu+delta},{ch:session.chapter,type:'rhythm',code:card.code,pct:r.pct,awarded:newAwarded,hieuDelta:delta}))
    }
    setResult(r)
    setPhase('result')
  }

  const onTap=()=>{
    if(phase!=='your-turn'||!card)return
    const now=performance.now()
    if(now-lastTapRef.current<120)return
    lastTapRef.current=now
    if(silenceTimerRef.current)clearTimeout(silenceTimerRef.current)
    const next=[...taps,now]
    setTaps(next)
    if(next.length<card.beats.length)silenceTimerRef.current=setTimeout(abortTap,2000)
    else finish(next)
  }

  const retry=()=>{setTaps([]);setResult(null);setNotice('');setPhase('your-turn')}
  const startPractice=()=>{setPractice(true);setTaps([]);setResult(null);setNotice('');setPhase('ready')}
  const [confirmingIntervention,setConfirmingIntervention]=useState(false)
  const useIntervention=()=>{save(logEvent({...session,usedInterventions:[...session.usedInterventions,'i-02'],interventionLog:{...(session.interventionLog||{}),'i-02':{at:Date.now(),chapter:session.chapter}}},{ch:session.chapter,type:'intervention',id:'i-02'}));setConfirmingIntervention(false)}

  const maxAttempts=card?card.baseAttempts+(session.usedInterventions.includes('i-02')?1:0):0
  const attemptNumber=Math.min(session.rhythmAttempts+1,Math.max(maxAttempts,1))
  const attemptsLeftAfter=maxAttempts-session.rhythmAttempts
  const passed=!!result&&!!card&&result.pct>=card.passAt
  const excellent=!!result&&!!card&&result.pct>=card.excellentAt
  const offerIntervention=!!result&&!passed&&!practice&&session.rhythmAttempts===1&&!session.usedInterventions.includes('i-02')

  return <main className='page rhythm-page'>
    <button className='back' onClick={()=>go('game')}>← Về game hub</button>
    <div className='eyebrow'>THẺ NHỊP–PHÁCH <span>MÃ {activeCode??'2714'} · CẤP ĐỘ {card?.level??1}</span></div>
    <h1>Lắng nghe<br/><em>rồi đáp lại.</em></h1>

    {phase==='entry'&&<div className='rhythm-entry'>
      <p>Nhập mã trên Thẻ Nhịp–Phách để mở mẫu nhịp đã được định sẵn.</p>
      <label htmlFor='rhythm-code'>NHẬP MÃ THẺ NHỊP–PHÁCH</label>
      <input id='rhythm-code' inputMode='numeric' maxLength={4} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} placeholder='— — — —'/>
      <button className='primary' onClick={begin}>Mở thử thách <ArrowRight/></button>
      {code&&!findRhythmCard(code)&&<small>Mã chưa khớp thẻ nào.</small>}
    </div>}

    {(phase==='ready'||phase==='playing'||phase==='your-turn')&&card&&<div className='rhythm-challenge'>
      <div className='rhythm-meta'>
        <span>{practice?'Luyện tập (không tính điểm)':`Lượt ${attemptNumber}/${maxAttempts}`}</span>
        <button className='sound-toggle' type='button' aria-pressed={soundOn} aria-label={`Âm thanh: ${soundOn?'bật':'tắt'}`} onClick={()=>setSoundOn(s=>!s)}>{soundOn?<Volume2/>:<VolumeX/>}</button>
      </div>
      <p>{phase==='ready'?'Nghe mẫu trước khi gõ.':phase==='playing'?'Đang phát mẫu...':'Gõ 5 phách theo mẫu. Phách đầu là mốc bắt đầu.'}</p>
      <div className='beats'>{card.beats.map((_,i)=><span className={litIndex===i?'hit':taps.length>i?'tapped':''} key={i}>{i+1}</span>)}</div>
      <div className='beat-numbers' aria-hidden='true'>1 · 2 · 3 · 4 · 5</div>
      <button className='outline' type='button' onClick={playPattern} disabled={phase==='playing'}>{phase==='playing'?'▶ Đang phát...':'▶ Nghe mẫu'}</button>
      {notice&&<p className='rhythm-notice' role='status'>{notice}</p>}
      <button className='clapper' type='button' disabled={phase!=='your-turn'} onPointerDown={onTap} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();onTap()}}}>GÕ THEO PHÁCH</button>
      <small>Trong Chèo, nhịp và phách góp phần giữ thời gian cho câu hát và tạo sắc thái cho tiết mục.</small>
    </div>}

    {phase==='result'&&result&&card&&<div className='rhythm-result' role='status' aria-live='polite'>
      <strong className='rhythm-pct'>{result.pct}%</strong>
      <p className='rhythm-verdict'>{practice?'Kết quả luyện tập, không tính điểm.':excellent?'Qua vòng xuất sắc — +2 điểm Hiểu Chèo':passed?'Qua vòng — +1 điểm Hiểu Chèo':'Chưa đạt ngưỡng 80%'}</p>
      <div className='beat-chips'>{result.beats.map((b,i)=>{const l=beatLabel(b);return <span className={`beat-${b.label}`} key={i}>{l.icon}{l.text}</span>})}</div>
      <div className='rhythm-actions'>
        {!practice&&passed&&<button className='primary' onClick={()=>go('game')}>Về game hub <ArrowRight/></button>}
        {!practice&&!passed&&attemptsLeftAfter>0&&<button className='primary' onClick={retry}>Thử lại <ArrowRight/></button>}
        {!practice&&!passed&&attemptsLeftAfter<=0&&<button className='primary' onClick={startPractice}>Luyện tập (không tính điểm)</button>}
        {practice&&<button className='primary' onClick={retry}>Thử lại <ArrowRight/></button>}
        <button className='outline' onClick={playPattern}>Nghe lại mẫu</button>
      </div>
      {offerIntervention&&<div className='rhythm-intervention'>
        <b>Thẻ Can Thiệp: Giữ nhịp câu chuyện</b>
        <p>Thêm 1 lượt thử.</p>
        <button className='outline' onClick={()=>setConfirmingIntervention(true)}>Dùng thẻ</button>
      </div>}
    </div>}
    {confirmingIntervention&&<ConfirmDialog
      title='Dùng thẻ "Giữ nhịp câu chuyện"?'
      body='Thẻ chỉ dùng được 1 lần trong ván.'
      confirmLabel='Dùng thẻ'
      cancelLabel='Để sau'
      onConfirm={useIntervention}
      onCancel={()=>setConfirmingIntervention(false)}
    />}
  </main>
}
function Guide({go}:{go:(p:Page)=>void}){return <main className="page guide-page"><div className="eyebrow">HƯỚNG DẪN CHƠI <span>ĐẶT BÀN · QUÉT THẺ · SUY LUẬN</span></div><h1>Chơi cùng nhau,<br/><em>nhìn khác đi.</em></h1><p className="lead">Trang web là người bạn đồng hành. Bàn chơi vật lý vẫn là nơi câu chuyện diễn ra.</p><div className="guide-steps">{[['01','Đặt bàn chơi','Chia vai Người Kể Tích, Người Soi Chứng và đặt các bộ thẻ trong tầm tay.'],['02','Mở Thẻ Tích Truyện','Đọc theo thứ tự. Khi gặp dấu OAN, cả nhóm dừng lại và không vội phán xét.'],['03','Nhập mã trên thẻ','Nhập mã 4 chữ số của Thẻ Góc Nhìn để đọc lời chứng của nhân vật.'],['04','Ghi nhớ lựa chọn','Dùng Thẻ Can Thiệp khi nhóm cần thêm một cơ hội. AI Vén Màn chỉ mở theo giới hạn của chương.']].map(s=><article key={s[0]}><span>{s[0]}</span><h2>{s[1]}</h2><p>{s[2]}</p></article>)}</div><button className="primary" onClick={()=>go('game')}>Mở game hub <ArrowRight/></button></main>}
function About(){return <main className="page about-page"><div className="eyebrow">VỀ DỰ ÁN <span>CHIẾU CHÈO SƯƠNG OAN</span></div><h1>Di sản để<br/><em>tiếp tục sống.</em></h1><p className="lead">Một nền tảng giáo dục dành cho học sinh trung học, kết nối trợ lý hỏi đáp về nghệ thuật truyền thống với trải nghiệm của bộ board game vật lý.</p><div className="about-grid"><section><h2>AI Hỏi Đáp Di Sản</h2><p>Trợ lý học tập trả lời về nghệ thuật truyền thống Việt Nam, ưu tiên nguồn đã kiểm chứng. Câu trả lời của AI chỉ là điểm bắt đầu, không thay thế tư liệu chuyên ngành.</p></section><section><h2>Nội dung trò chơi</h2><p>Chiếu Chèo Sương Oan dùng câu chuyện, Góc Nhìn, Oan và Nhịp–Phách để khuyến khích học sinh nhìn một tình huống từ nhiều phía.</p></section><section><h2>Phương pháp</h2><p>Prototype sử dụng dữ liệu mô phỏng có kiểm soát. Những phần cần xác minh được đánh dấu rõ để có thể thay bằng nguồn bảo tàng, trường đại học và cơ quan văn hóa trước khi xuất bản.</p></section></div><section id="nguon-ghi-nhan" className="about-credits"><h2>Nguồn & ghi nhận</h2><ul><li>Nguồn tư liệu của AI: [Nội dung cần bổ sung]</li><li>Quyền hình ảnh: [Nội dung cần bổ sung]</li><li>Đơn vị thực hiện: [Nội dung cần bổ sung]</li><li>Liên hệ: [Nội dung cần bổ sung]</li></ul></section></main>}
const JOURNEY_CHAPTER_RANGES:[number,number][]=[[1,11],[12,22],[23,33],[34,44],[45,52]]
const journeySpaces=Array.from({length:52},(_,i)=>({n:i+1,chapter:Math.min(5,Math.floor(i/11)+1),type:i===0?'start':i===51?'finish':i%11===10?'chapter':i%7===0?'evidence':i%5===0?'choice':'story'} as const))
const journeyTypeLabel:Record<string,string>={start:'ô mở đầu',finish:'ô giác',chapter:'chốt chương',evidence:'bằng chứng',choice:'lựa chọn',story:'cảnh kể'}
function journeySpaceDetail(space:typeof journeySpaces[number]){
  const title=space.type==='evidence'?'Một bằng chứng chưa đủ.':space.type==='choice'?'Bạn sẽ chọn nhìn từ đâu?':space.type==='chapter'?chapters[space.chapter-1]:space.type==='finish'?'Giác':'Tiếng kể tiếp tục.'
  const body=space.type==='evidence'?'Bằng chứng không tự nói ra đáp án. Nhóm cần đặt nó cạnh một lời chứng khác.':'Chạm vào các ô để xem nhịp của hành trình và mở đúng trải nghiệm khi bàn chơi yêu cầu.'
  // Only cells with a real destination get a button (spec 5.9, AC-HT-6): the old "Tiếp tục" link
  // back to the hub on every other cell type was a dead end, not a feature.
  const cta:{label:string;page:Page}|null=space.type==='evidence'?{label:'Mở Góc Nhìn',page:'perspective'}:space.type==='choice'?{label:'Xem Thẻ Can Thiệp',page:'intervention'}:space.type==='chapter'?{label:`AI Vén Màn chương ${space.chapter}`,page:'ven'}:null
  return {title,body,cta}
}
function JourneySpaceDetail({space,go}:{space:typeof journeySpaces[number];go:(p:Page)=>void}){
  const {title,body,cta}=journeySpaceDetail(space)
  return <aside className="space-detail"><span className="eyebrow">Ô {String(space.n).padStart(2,'0')} · CHƯƠNG {space.chapter}</span><h2>{title}</h2><p>{body}</p>{cta&&<button className="primary" onClick={()=>go(cta.page)}>{cta.label} <ArrowRight/></button>}</aside>
}
function Journey({go}:{go:(p:Page)=>void}){
  const searchParams=useSearchParams()
  const [active,setActive]=useState(0)
  const [activeTab,setActiveTab]=useState(1)
  const tabRefs=useRef<Record<number,HTMLButtonElement|null>>({})
  const spaces=journeySpaces

  useEffect(()=>{
    const chuongRaw=searchParams.get('chuong')
    const chuongParam=Number(chuongRaw)
    const oParam=Number(searchParams.get('o'))
    const tab=chuongParam>=1&&chuongParam<=5?chuongParam:1
    let cellN:number
    if(oParam>=1&&oParam<=52){
      cellN=oParam
      setActiveTab(chuongRaw?tab:spaces[cellN-1].chapter)
    }else{
      // spec 5.9: an out-of-range ?o is ignored; falls back to the active tab's first cell
      // (rather than a literal global ô 1) so the selected cell always matches what's on screen.
      cellN=JOURNEY_CHAPTER_RANGES[tab-1][0]
      setActiveTab(tab)
    }
    setActive(cellN-1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const selectTab=(n:number)=>{setActiveTab(n);setActive(JOURNEY_CHAPTER_RANGES[n-1][0]-1)}
  const onTabKey=(e:React.KeyboardEvent)=>{
    if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
      e.preventDefault()
      const next=e.key==='ArrowRight'?(activeTab<5?activeTab+1:1):(activeTab>1?activeTab-1:5)
      selectTab(next)
      tabRefs.current[next]?.focus()
    }
  }

  const [rangeStart,rangeEnd]=JOURNEY_CHAPTER_RANGES[activeTab-1]
  const chapterSpaces=spaces.slice(rangeStart-1,rangeEnd)

  return <main className="page journey journey-board">
    <div className="eyebrow">BẢN ĐỒ HÀNH TRÌNH <span>52 Ô · 5 CHƯƠNG</span></div>
    <h1>Đường đi không<br/><em>thẳng.</em></h1>
    <p className="lead">Mỗi ô là một lần dừng lại. Mỗi chương mở ra một cách nhìn khác về cùng một câu chuyện.</p>

    <div className="journey-tabs">
      <div className="journey-tablist" role="tablist" aria-label="Chọn chương" onKeyDown={onTabKey}>
        {[1,2,3,4,5].map(n=><button key={n} ref={el=>{tabRefs.current[n]=el}} role="tab" aria-selected={activeTab===n} tabIndex={activeTab===n?0:-1} className={`journey-tab${activeTab===n?' selected':''}`} onClick={()=>selectTab(n)}>C{n}</button>)}
      </div>
      <h2>Chương {activeTab} · {chapters[activeTab-1]}</h2>
      <p className="journey-tab-range">Ô {rangeStart}–{rangeEnd}</p>
      <div className="journey-mini-grid">
        {chapterSpaces.map(space=><button key={space.n} className={`board-space ${space.type}${space.n-1===active?' selected':''}`} onClick={()=>setActive(space.n-1)} aria-label={`Ô ${space.n}, chương ${space.chapter}, ${journeyTypeLabel[space.type]}`}><span>{String(space.n).padStart(2,'0')}</span><b>{space.type==='start'?'MỞ':space.type==='finish'?'GIÁC':space.type==='chapter'?`C${space.chapter}`:space.type==='evidence'?'?':space.type==='choice'?'×':'·'}</b></button>)}
      </div>
      <p className="journey-legend">Chú giải: C1 chốt chương · ? bằng chứng · × lựa chọn · · cảnh kể</p>
      <JourneySpaceDetail space={spaces[active]} go={go}/>
    </div>

    <div className="journey-desktop">
      <div className="journey-head"><div className="journey-progress"><strong>{String(active+1).padStart(2,'0')} / 52</strong><span>Ô ĐANG XEM: {active+1}</span></div></div>
      <div className="board-wrap">
        <div className="board-grid">{spaces.map(space=><button key={space.n} className={`board-space ${space.type} ${space.n-1===active?'selected':''}`} onClick={()=>setActive(space.n-1)} aria-label={`Ô ${space.n}, chương ${space.chapter}, ${journeyTypeLabel[space.type]}`}><span>{String(space.n).padStart(2,'0')}</span><b>{space.type==='start'?'MỞ':space.type==='finish'?'GIÁC':space.type==='chapter'?`C${space.chapter}`:space.type==='evidence'?'?':space.type==='choice'?'×':'·'}</b></button>)}</div>
        <JourneySpaceDetail space={spaces[active]} go={go}/>
      </div>
      <p className="journey-legend">Chú giải: C1 chốt chương · ? bằng chứng · × lựa chọn · · cảnh kể</p>
    </div>
  </main>
}
export default AppShell
