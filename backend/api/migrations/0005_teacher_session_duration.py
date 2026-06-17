from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_teacher_categories_teacher_headline_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='teacher',
            name='session_duration',
            field=models.CharField(
                choices=[('30', '30 minutes'), ('60', '60 minutes'), ('both', 'Both 30 and 60 minutes')],
                default='both',
                help_text='Allowed session durations for booking',
                max_length=10,
            ),
        ),
    ]
