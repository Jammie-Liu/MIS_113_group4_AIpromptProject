import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IconClose } from '../icons.jsx'

/*
  對應原本 openModal()/closeModal() 那一套共用機制：彈跳視窗一律掛在 DOM 上，
  用 `.show` class 控制淡入/縮放動畫，而不是條件式掛載，這樣才能保留原本的
  開場動畫。點背景、按右上角關閉、按 Escape 都會觸發 onClose。

  用 createPortal 直接掛到 document.body，而不是跟著畫面內容一起渲染在原本的
  位置：因為 .modal-overlay 是 position:fixed，理論上應該要蓋滿整個視窗，但
  CSS 規則是「只要祖先元素有套用 transform（含動畫結束後還留著的 transform，
  即使看起來等於沒變化），該祖先就會變成 fixed 元素的定位基準，而不是整個
  視窗」。畫面切換動畫（.screen-pop）或其他祖先元素之後只要有用到
  transform/filter 相關效果，都可能讓彈跳視窗的變暗/模糊背景被限制在某個
  區塊裡，而不是蓋住全頁——用 portal 直接掛到 body 下面，就不會受任何祖先
  元素的樣式影響，一勞永逸避開這個問題。
*/
export default function Modal({ show, onClose, children, boxStyle, boxClassName = '', labelledBy }) {
  useEffect(() => {
    if (!show) return
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [show, onClose])

  return createPortal(
    <div
      className={`modal-overlay${show ? ' show' : ''}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`modal-box ${boxClassName}`.trim()} style={boxStyle} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        <button className="modal-close" aria-label="關閉" onClick={onClose}><IconClose size={16} /></button>
        <div className="modal-scroll">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
