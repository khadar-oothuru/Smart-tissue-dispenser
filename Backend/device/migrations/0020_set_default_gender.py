# Generated migration to set default gender for existing toilet paper devices

from django.db import migrations

def set_default_gender(apps, schema_editor):
    Device = apps.get_model('device', 'Device')
    # Set default gender to 'male' for existing toilet paper devices without gender
    Device.objects.filter(tissue_type='toilet_paper', gender__isnull=True).update(gender='male')

def reverse_set_default_gender(apps, schema_editor):
    Device = apps.get_model('device', 'Device')
    # Optional: reverse by setting gender back to null
    Device.objects.filter(tissue_type='toilet_paper', gender='male').update(gender=None)

class Migration(migrations.Migration):

    dependencies = [
        ('device', '0019_device_gender'),
    ]

    operations = [
        migrations.RunPython(set_default_gender, reverse_set_default_gender),
    ]
