import os
from django.core.management.base import BaseCommand
from accounts.models import Tenant, User
from ingestion.models import DataSource, RawIngestion
from records.models import NormalizedRecord
from audit.models import AuditLog

# Parsers
from ingestion.parsers.sap_parser import parse_sap_csv
from ingestion.parsers.utility_parser import parse_utility_csv
from ingestion.parsers.travel_parser import parse_travel_csv

class Command(BaseCommand):
    help = 'Seeds default tenant, users, data sources, and runs sample file ingestion'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting ESG database seeding...")
        
        # 1. Truncate existing data to start clean
        self.stdout.write("Clearing existing ESG data...")
        AuditLog.objects.all().delete()
        NormalizedRecord.objects.all().delete()
        RawIngestion.objects.all().delete()
        DataSource.objects.all().delete()
        User.objects.all().delete()
        Tenant.objects.all().delete()
        
        # 2. Create Default Tenant
        tenant = Tenant.objects.create(name="Breathe Corporate")
        self.stdout.write(self.style.SUCCESS(f"Created Tenant: {tenant.name}"))
        
        # 3. Create Default Users (analyst and auditor)
        analyst = User.objects.create_user(
            email="analyst@breatheesg.com",
            password="Test1234",
            first_name="Jane",
            last_name="Analyst",
            tenant=tenant,
            role="analyst"
        )
        self.stdout.write(self.style.SUCCESS(f"Created Analyst User: {analyst.email} (Password: Test1234)"))
        
        auditor = User.objects.create_user(
            email="auditor@breatheesg.com",
            password="Test1234",
            first_name="John",
            last_name="Auditor",
            tenant=tenant,
            role="auditor"
        )
        self.stdout.write(self.style.SUCCESS(f"Created Auditor User: {auditor.email} (Password: Test1234)"))
        
        # 4. Create Data Sources
        sap_source = DataSource.objects.create(
            tenant=tenant,
            name="SAP ERP Fuel & Procurement System",
            source_type="sap",
            description="Flat file exports detailing factory diesel, gasoline, and natural gas usage."
        )
        
        utility_source = DataSource.objects.create(
            tenant=tenant,
            name="PG&E Grid Electricity Utility Portal",
            source_type="utility",
            description="Portal CSV exports for factory and office purchased grid electricity."
        )
        
        travel_source = DataSource.objects.create(
            tenant=tenant,
            name="Concur Business Travel Expense System",
            source_type="travel",
            description="Expense logs capturing flights, taxi rides, and hotel room bookings."
        )
        self.stdout.write(self.style.SUCCESS("Created Data Sources."))
        
        # 5. Ingest Sample SAP Data
        sap_path = os.path.join('sample_data', 'sap_sample.csv')
        if os.path.exists(sap_path):
            with open(sap_path, 'r') as f:
                content = f.read()
                
            raw_sap = RawIngestion.objects.create(
                tenant=tenant,
                data_source=sap_source,
                file_name="sap_emissions_q2.csv",
                status="processing",
                uploaded_by=analyst
            )
            
            rows = parse_sap_csv(content, raw_sap)
            raw_sap.status = "success"
            raw_sap.save()
            self.stdout.write(self.style.SUCCESS(f"Successfully ingested SAP data ({rows} rows created)"))
            
        # 6. Ingest Sample Utility Data
        utility_path = os.path.join('sample_data', 'utility_sample.csv')
        if os.path.exists(utility_path):
            with open(utility_path, 'r') as f:
                content = f.read()
                
            raw_utility = RawIngestion.objects.create(
                tenant=tenant,
                data_source=utility_source,
                file_name="utility_billing_april26.csv",
                status="processing",
                uploaded_by=analyst
            )
            
            rows = parse_utility_csv(content, raw_utility)
            raw_utility.status = "success"
            raw_utility.save()
            self.stdout.write(self.style.SUCCESS(f"Successfully ingested Utility data ({rows} rows created)"))
            
        # 7. Ingest Sample Travel Data
        travel_path = os.path.join('sample_data', 'travel_sample.csv')
        if os.path.exists(travel_path):
            with open(travel_path, 'r') as f:
                content = f.read()
                
            raw_travel = RawIngestion.objects.create(
                tenant=tenant,
                data_source=travel_source,
                file_name="concur_travel_expenses_april.csv",
                status="processing",
                uploaded_by=analyst
            )
            
            rows = parse_travel_csv(content, raw_travel)
            raw_travel.status = "success"
            raw_travel.save()
            self.stdout.write(self.style.SUCCESS(f"Successfully ingested Travel data ({rows} rows created)"))
            
        self.stdout.write(self.style.SUCCESS("ESG Database Seeding Completed successfully!"))
