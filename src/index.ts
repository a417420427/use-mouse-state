import isMobile from './isMobile';
import { useState, useCallback, useEffect, useRef, Dispatch, SetStateAction } from 'react';

export interface MouseState {
  /** x轴方向的偏移量 */
  moveX: number;
  /** y轴方向的偏移量 */
  moveY: number;
  rotation: number;
  scale: number;
}

export const initialMouseState: MouseState = {
  moveX: 0,
  moveY: 0,
  rotation: 0,
  scale: 1,
};
const initialRecord = {
  initialX: 0,
  initialY: 0,
  initialDistance: 1,
  initialRotation: 0,
  touchStartX: 0,
};

export const useMouseState = (
  target: HTMLElement,
  shouldMove?: boolean,
): [MouseState, Dispatch<SetStateAction<MouseState>>] => {
  const [mouseState, setMouseState] = useState<MouseState>(initialMouseState);
  const recordRef = useRef(initialRecord);

  const onMousePositionChange = useCallback((mouseState: Partial<MouseState>) => {
    const { moveY = 0, moveX = 0, scale = 0, rotation = 0 } = mouseState;
    if (!moveX && !moveY && !scale && !rotation) {
      return;
    }
    setMouseState((prevPosition) => ({
      ...prevPosition,
      moveX: moveX + prevPosition.moveX,
      moveY: moveY + prevPosition.moveY,
      scale: scale + prevPosition.scale,
      rotation: rotation + prevPosition.rotation,
    }));
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      const { initialY, initialX } = recordRef.current;
      if (initialY !== 0 && initialX !== 0) {
        recordRef.current.initialX = e.clientX;
        recordRef.current.initialY = e.clientY;
        onMousePositionChange({
          moveX: e.clientX - initialX,
          moveY: e.clientY - initialY,
        });
      }
    },
    [onMousePositionChange],
  );

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      const currentTarget = e.target as HTMLElement;
      if (target.contains(currentTarget) || target === currentTarget) {
        recordRef.current.initialX = e.clientX;
        recordRef.current.initialY = e.clientY;
      }
    },
    [target],
  );

  const onMouseUp = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      if (!shouldMove) {
        setMouseState((state) => ({
          ...state,
          moveX: 0,
          moveY: 0,
        }));
      }
      recordRef.current.initialX = 0;
      recordRef.current.initialY = 0;
    },
    [shouldMove],
  );

  const onMouseWheel = useCallback(
    (_e: Event) => {
      const e = _e as WheelEvent;
      e.preventDefault();
      if (e.ctrlKey) {
        onMousePositionChange({ scale: -e.deltaY * 0.01 });
      } else {
        onMousePositionChange({
          moveX: -e.deltaX * 2,
          moveY: -e.deltaY * 2,
        });
      }
    },
    [onMousePositionChange],
  );

  const onGesturechange = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      const { initialDistance, initialRotation } = recordRef.current;

      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const currentRotation = getRotation(e.touches[0], e.touches[1]);
      onMousePositionChange({
        /** 角度差即是图片旋转角度 */
        rotation: currentRotation - initialRotation,
        /** 距离差/初始距离 即是放大倍数 */
        scale: (currentDistance - initialDistance) / initialDistance,
      });

      recordRef.current.initialDistance = currentDistance;
      recordRef.current.initialRotation = currentRotation;
    },
    [onMousePositionChange],
  );

  const onGesturestart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    recordRef.current.initialRotation = getRotation(e.touches[0], e.touches[1]);
    recordRef.current.initialDistance = getDistance(e.touches[0], e.touches[1]);
  }, []);

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length > 1) {
        onGesturestart(e);
        return;
      }
      const touch = e.touches[0];
      if ((e.target as HTMLElement).tagName === 'IMG') {
        recordRef.current.initialX = touch.clientX;
        recordRef.current.initialY = touch.clientY;
      }
    },
    [onGesturestart],
  );

  const onTouchEnd = useCallback(() => {
    recordRef.current.initialX = 0;
    recordRef.current.initialY = 0;
    if (!shouldMove) {
      setMouseState((state) => ({
        ...state,
        moveX: 0,
        moveY: 0,
      }));
    }
  }, [shouldMove]);

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length > 1) {
        onGesturechange(e);
        return;
      }
      const touch = e.touches[0];
      const { initialY, initialX } = recordRef.current;
      if (initialY !== 0 && initialX !== 0) {
        recordRef.current.initialX = touch.clientX;
        recordRef.current.initialY = touch.clientY;
        onMousePositionChange({
          moveX: touch.clientX - initialX,
          moveY: touch.clientY - initialY,
        });
      }
    },
    [onMousePositionChange, onGesturechange],
  );

  const initMobileEvents = useCallback(() => {
    function preventTouchMoveDefaut(e: any) {
      e.preventDefault();
    }
    document.body.addEventListener('touchmove', preventTouchMoveDefaut, {
      passive: false,
    });
    target.addEventListener('touchstart', onTouchStart);
    target.addEventListener('touchmove', onTouchMove);
    target.addEventListener('touchend', onTouchEnd);
    window.addEventListener('mousewheel', onMouseWheel, {
      passive: false,
    });
    return () => {
      document.body.removeEventListener('touchmove', preventTouchMoveDefaut);
      target.removeEventListener('touchstart', onTouchStart);
      target.removeEventListener('touchmove', onTouchMove);
      target.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('mousewheel', onMouseWheel);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd, onMouseWheel, target]);

  const initPcEvents = useCallback(() => {
    target.addEventListener('mousedown', onMouseDown);
    target.addEventListener('mousemove', onMouseMove);
    target.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousewheel', onMouseWheel, {
      passive: false,
    });

    return () => {
      target.removeEventListener('mousedown', onMouseDown);
      target.removeEventListener('mousemove', onMouseMove);
      target.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousewheel', onMouseWheel);
    };
  }, [onMouseDown, onMouseMove, onMouseUp, onMouseWheel, target]);

  const initEvents = useCallback(() => {
    if (isMobile()) {
      return initMobileEvents();
    } else {
      return initPcEvents();
    }
  }, [initMobileEvents, initPcEvents]);

  useEffect(() => {
    return initEvents();
  }, [initEvents]);

  return [mouseState, setMouseState];
};

/**
 *  两个手指之间的角度
 */
function getRotation(touch1: Touch, touch2: Touch) {
  const x = touch2.clientX - touch1.clientX; //临边
  const y = touch2.clientY - touch1.clientY; //对边
  const angle = Math.atan2(y, x); //是个弧度
  const deg = (angle / Math.PI) * 180;
  return deg;
}

/**
 * 两个手指之间的距离
 */
function getDistance(touch1: Touch, touch2: Touch) {
  const x = touch2.clientX - touch1.clientX;
  const y = touch2.clientY - touch1.clientY;
  const z = Math.sqrt(x * x + y * y);
  return z;
}
