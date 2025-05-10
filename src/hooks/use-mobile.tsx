
import * as React from "react"
import { Device } from "@capacitor/core";

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(true);

  React.useEffect(() => {
    async function checkPlatform() {
      try {
        const info = await Device.getInfo();
        setIsMobile(info.platform !== "web");
      } catch (e) {
        // If Capacitor isn't available, we're likely in a web browser
        const userAgent = navigator.userAgent;
        const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        setIsMobile(mobileCheck || window.innerWidth < 768);
      }
    }
    
    checkPlatform();
    
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsMobile(true);
      } else {
        // Only update if we're in a browser context
        const userAgent = navigator.userAgent;
        const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        setIsMobile(mobileCheck);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
