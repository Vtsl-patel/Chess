import React from 'react'
import BoardRenderer from '../components/board-renderer'

const Home = () => {
  return (
    <div>
      <div className='flex h-screen items-center justify-center bg-[#302E2B]'>
        <BoardRenderer />
      </div>
    </div>
  )
}

export default Home