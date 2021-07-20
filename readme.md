# a hook of mouse state by listen mouse event

## 使用

```javascript
import { useCallback } from 'react';
import { initialMouseState, useMouseState } from './src';

const Sample = () => {
  const [mouseState, setMouseState] = useMouseState(document.body);
  const resetState = useCallback(() => {
    setMouseState(initialMouseState);
  }, [setMouseState]);
  return (
    <div className="mouse-state">
      <button onClick={resetState}>重置</button>
      <div className="moveX">x轴方向的移动距离，初始为0: {mouseState.moveX}</div>
      <div className="moveX">y轴方向的移动距离，初始为0: {mouseState.moveY}</div>
      <div className="moveX">放大倍数，初始值为1: {mouseState.scale}</div>
      <div className="moveX">旋转角度，初始为0: {mouseState.rotation}</div>
    </div>
  );
};
```
