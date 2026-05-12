import { useEffect } from 'react';

/**
 * Hook: 检测当前用户是否处于亡者状态
 */
export const useGhostlyVision = (isDead: boolean, isEnabled = true) => {
  useEffect(() => {
    const appElement = document.getElementById('root');
    if (appElement) {
      if (isDead && isEnabled) {
        appElement.classList.add('ghostly-vision-active');
      } else {
        appElement.classList.remove('ghostly-vision-active');
      }
    }

    return () => {
      appElement?.classList.remove('ghostly-vision-active');
    };
  }, [isDead, isEnabled]);

  return isDead && isEnabled;
};

export default useGhostlyVision;
