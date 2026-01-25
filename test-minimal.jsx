import { useState } from 'react'

function Test() {
  const [count, setCount] = useState(0)
  return <div>Count: {count}</div>
}

export default Test
