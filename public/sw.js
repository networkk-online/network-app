// Service Worker للإشعارات التفاعلية
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      image: data.image,
      data: data.data,
      actions: data.actions || [
        {
          action: 'reply',
          title: '💬 رد',
          type: 'text',
          placeholder: 'اكتب ردك هنا...'
        },
        {
          action: 'like',
          title: '❤️ إعجاب',
          type: 'button'
        },
        {
          action: 'view',
          title: '👁️ عرض',
          type: 'button'
        }
      ],
      tag: data.tag,
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// التعامل مع النقر على الإشعار
self.addEventListener('notificationclick', function(event) {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data;

  if (action === 'reply') {
    // فتح نافذة الرد السريع
    event.waitUntil(
      clients.openWindow(`${self.location.origin}/quick-reply?postId=${data.postId}&userId=${data.userId}`)
    );
  } else if (action === 'like') {
    // إرسال الإعجاب
    event.waitUntil(
      fetch(`${self.location.origin}/api/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: data.postId,
          userId: data.userId,
          action: 'like'
        })
      }).then(() => {
        // إظهار إشعار تأكيد
        self.registration.showNotification('✅ تم الإعجاب!', {
          body: 'تم تسجيل إعجابك بالمنشور',
          icon: '/favicon.ico',
          tag: 'like-confirmation',
          silent: true
        });
      })
    );
  } else if (action === 'view') {
    // فتح المنشور
    event.waitUntil(
      clients.openWindow(`${self.location.origin}/post/${data.postId}`)
    );
  } else {
    // النقر على الإشعار نفسه
    event.waitUntil(
      clients.openWindow(`${self.location.origin}/post/${data.postId}`)
    );
  }

  notification.close();
});

// التعامل مع الرد من الإشعار
self.addEventListener('notificationclose', function(event) {
  console.log('تم إغلاق الإشعار:', event.notification.tag);
});

// معالجة الرسائل من الصفحة الرئيسية
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SEND_NOTIFICATION') {
    const { title, body, data, actions } = event.data.payload;
    
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.ico',
      data,
      actions,
      requireInteraction: true
    });
  }
});