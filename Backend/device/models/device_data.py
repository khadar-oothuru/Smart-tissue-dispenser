
from django.db import models
from .device import Device  



class DeviceData(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    alert = models.CharField(max_length=20)
    count = models.IntegerField()
    refer_val = models.IntegerField()
    tamper = models.CharField(max_length=10)
    total_usage = models.IntegerField(null=True, blank=True)
    battery_percentage = models.FloatField(null=True, blank=True)
    power_status = models.CharField(max_length=10, null=True, blank=True, help_text="Power status at time of data (ON/OFF/NONE)")
    device_timestamp = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"{self.device.name} @ {self.timestamp}"