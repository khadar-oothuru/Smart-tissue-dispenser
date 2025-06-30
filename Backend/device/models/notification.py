


from django.db import models
from .device import Device


# class Notification(models.Model):
#     device = models.ForeignKey(Device, on_delete=models.CASCADE)
#     message = models.TextField()
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"Notif: {self.device} - {self.message}"




# device/models.py (Simplified Notification model)
class Notification(models.Model):
    NOTIFICATION_TYPE_CHOICES = [
        ('tamper', 'Tamper Alert'),
        ('empty', 'Empty Alert'),
        ('low', 'Low Tissue Alert'),
        ('battery_low', 'Low Battery Alert'),
        ('battery_critical', 'Critical Battery Alert'),
        ('power_off', 'Power Off Alert'),
        # ('full', 'Full Alert'),  # COMMENTED OUT - Full notifications disabled
    ]
    
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    title = models.CharField(max_length=200, default='Device Alert')
    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPE_CHOICES,
        default='low',
        help_text="Type of alert for frontend styling"
    )
    alert = models.CharField(max_length=50, blank=True, default='')
    tamper = models.CharField(max_length=10, blank=True, default='')
    battery_percentage = models.FloatField(null=True, blank=True, help_text="Battery percentage at time of notification")
    power_status = models.CharField(max_length=10, blank=True, default='', help_text="Power status at time of notification (ON/OFF/NONE)")
    priority = models.IntegerField(
        default=50,
        help_text="Priority for sorting (100=tamper, 90=empty, 80=low, 75=battery_critical, 74=battery_low, 70=power_off, 60=full)"
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-priority', '-created_at']

    def __str__(self):
        return f"{self.notification_type.upper()}: {self.device} - {self.title}"