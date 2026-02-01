import { useEffect } from 'react';

/**
 * Chatway Widget Component
 * Loads the Chatway chatbot widget on the page
 * 
 * Widget ID: 8kfnZmfZlnNV
 * Script source: https://cdn.chatway.app/widget.js
 */
export const ChatwayWidget = () => {
  useEffect(() => {
    // Check if the script is already loaded
    if (document.querySelector('script#chatway')) {
      return;
    }

    // Create and load the Chatway widget script
    const script = document.createElement('script');
    script.id = 'chatway';
    script.src = 'https://cdn.chatway.app/widget.js?id=8kfnZmfZlnNV';
    script.async = true;
    
    // Append to document head
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      // Optional: Remove script on unmount if needed
      // Keeping it commented as most users want the widget to persist
      // const scriptElement = document.querySelector('script#chatway');
      // if (scriptElement) {
      //   scriptElement.remove();
      // }
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export default ChatwayWidget;
