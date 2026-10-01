import { useEffect } from 'react'
import { IconClose } from '../icons.jsx'

/*
  對應原本 openModal()/closeModal() 那一套共用機制：彈跳視窗一律掛在 DOM 上，
  用 `.show` class 控制淡入/縮放動畫，而不是條件式掛載，這樣才能保留原本的
  開場動畫。點背景、按右上角關閉、按 Escape 都會觸發 onClose。
*/
export default function Modal({ show, onClose, children, boxStyle, labelledBy }) {
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

  return (
    <div
      className={`modal-overlay${show ? ' show' : ''}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-box" style={boxStyle} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        <button className="modal-close" aria-label="關閉" onClick={onClose}><IconClose size={16} /></button>
        {children}
      </div>
    </div>
  )
}
