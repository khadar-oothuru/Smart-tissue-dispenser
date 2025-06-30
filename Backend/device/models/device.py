
from django.db import models
from django.conf import settings

class Device(models.Model):
    name = models.CharField(max_length=100)
    floor_number = models.IntegerField()
    room_number = models.CharField(max_length=50)
    device_id = models.CharField(
        max_length=100, blank=True, null=True, unique=True, db_index=True,
        help_text="Optional unique device ID from Smart tissue dispenser"
    )
    
    # Add these two fields only
    registration_type = models.CharField(
        max_length=20, 
        choices=[('manual', 'Manual'), ('wifi', 'WiFi')],
        default='manual'
    )
    metadata = models.JSONField(default=dict, blank=True, null=True)  # Store WiFi-specific data
    
    # New fields for tissue type and meter capacity
    tissue_type = models.CharField(
        max_length=50,
        choices=[('hand_towel', 'Hand Towel'), ('toilet_paper', 'Toilet Paper')],
        default='hand_towel',
        help_text="Type of tissue in the dispenser"
    )
    meter_capacity = models.IntegerField(
        default=500,
        help_text="Meter capacity which determines the reference value"
    )
    refer_value = models.IntegerField(
        default=500,
        help_text="Reference value automatically set based on meter capacity"
    )
    
    added_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Automatically set refer_value based on meter_capacity
        self.refer_value = self.meter_capacity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - Room {self.room_number}"