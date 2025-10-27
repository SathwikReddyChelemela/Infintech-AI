import os
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.server_api import ServerApi

# Always load env from server/.env (single source of truth)
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is not set")
if not DB_NAME:
    raise ValueError("DB_NAME environment variable is not set")

print(f"🔗 Using MongoDB URI: {MONGO_URI}")
print(f"📊 Using Database: {DB_NAME}")

# Use only MongoDB Atlas - no local/mock users
USE_MOCK_DB = False

if USE_MOCK_DB:
    print("🔧 Using mock database for development...")
    
    # Create mock collections that behave like MongoDB collections
    class MockCollection:
        def __init__(self, name):
            self.name = name
            self.data = []
        
        def create_index(self, field, **kwargs):
            print(f"📝 Mock: Created index on {field} for {self.name}")
            return f"{self.name}_{field}_index"
        
        def find(self, query=None, **kwargs):
            return MockCursor(self.data)
        
        def find_one(self, query=None, **kwargs):
            if query:
                for item in self.data:
                    if all(item.get(k) == v for k, v in query.items()):
                        return item
            return self.data[0] if self.data else None
        
        def insert_one(self, document):
            document['_id'] = f"mock_{len(self.data)}"
            self.data.append(document)
            return MockInsertResult(document['_id'])
        
        def update_one(self, query, update, **kwargs):
            for i, item in enumerate(self.data):
                if all(item.get(k) == v for k, v in query.items()):
                    if '$set' in update:
                        self.data[i].update(update['$set'])
                    return MockUpdateResult(1)
            return MockUpdateResult(0)
        
        def delete_one(self, query):
            for i, item in enumerate(self.data):
                if all(item.get(k) == v for k, v in query.items()):
                    del self.data[i]
                    return MockDeleteResult(1)
            return MockDeleteResult(0)
    
    class MockCursor:
        def __init__(self, data):
            self.data = data
            self.index = 0
        
        def __iter__(self):
            return self
        
        def __next__(self):
            if self.index < len(self.data):
                item = self.data[self.index]
                self.index += 1
                return item
            raise StopIteration
        
        def to_list(self, length=None):
            return self.data[:length] if length else self.data
    
    class MockInsertResult:
        def __init__(self, inserted_id):
            self.inserted_id = inserted_id
    
    class MockUpdateResult:
        def __init__(self, modified_count):
            self.modified_count = modified_count
    
    class MockDeleteResult:
        def __init__(self, deleted_count):
            self.deleted_count = deleted_count
    
    # Create mock client and database
    class MockClient:
        def __init__(self):
            self.admin = MockAdmin()
        
        def __getitem__(self, db_name):
            return MockDatabase(db_name)
    
    class MockAdmin:
        def command(self, cmd):
            if cmd == 'ping':
                return {'ok': 1}
            return {'ok': 1}
    
    class MockDatabase:
        def __init__(self, name):
            self.name = name
            self._collections = {}
        
        def __getitem__(self, collection_name):
            if collection_name not in self._collections:
                self._collections[collection_name] = MockCollection(collection_name)
            return self._collections[collection_name]
    
    client = MockClient()
    db = client[DB_NAME]
    
    print("✅ Mock database initialized successfully!")
    
    # Core collections
    users_collection = db["users"]
    applications_collection = db["applications"]
    documents_collection = db["documents"]
    messages_collection = db["messages"]
    audit_events_collection = db["audit_events"]
    payments_collection = db["payments"]

    # Create indexes for better performance
    # Users collection
    users_collection.create_index("username", unique=True)
    users_collection.create_index("role")

    # Applications collection
    applications_collection.create_index("customer_id")
    applications_collection.create_index("status")
    applications_collection.create_index("created_at")
    applications_collection.create_index("updated_at")

    # Documents collection
    documents_collection.create_index("application_id")
    documents_collection.create_index("type")
    documents_collection.create_index("uploaded_at")

    # Messages collection
    messages_collection.create_index("application_id")
    messages_collection.create_index("from_role")
    messages_collection.create_index("to_role")
    messages_collection.create_index("created_at")

    # Audit events collection
    audit_events_collection.create_index("application_id")
    audit_events_collection.create_index("actor_role")
    audit_events_collection.create_index("action")
    audit_events_collection.create_index("created_at")

    # Payments collection
    payments_collection.create_index("user_id")
    payments_collection.create_index("updated_at")

    print("✅ Database indexes created successfully!")
    
else:
    try:
        # MongoDB Atlas connection with SSL certificate handling for macOS
        print("🔄 Connecting to MongoDB Atlas...")

        import certifi

        client = MongoClient(
            MONGO_URI,
            server_api=ServerApi('1'),
            connectTimeoutMS=30000,
            socketTimeoutMS=45000,
            serverSelectionTimeoutMS=30000,
            tls=True,
            tlsCAFile=certifi.where(),
        )

        # Test the connection
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB Atlas!")

        db = client[DB_NAME]

        # Core collections
        users_collection = db["users"]
        applications_collection = db["applications"]
        documents_collection = db["documents"]
        messages_collection = db["messages"]
        audit_events_collection = db["audit_events"]
        payments_collection = db["payments"]

        # Create indexes for better performance
        # Users collection
        users_collection.create_index("username", unique=True)
        users_collection.create_index("role")

        # Applications collection
        applications_collection.create_index("customer_id")
        applications_collection.create_index("status")
        applications_collection.create_index("created_at")
        applications_collection.create_index("updated_at")

        # Documents collection
        documents_collection.create_index("application_id")
        documents_collection.create_index("type")
        documents_collection.create_index("uploaded_at")

        # Messages collection
        messages_collection.create_index("application_id")
        messages_collection.create_index("from_role")
        messages_collection.create_index("to_role")
        messages_collection.create_index("created_at")

        # Audit events collection
        audit_events_collection.create_index("application_id")
        audit_events_collection.create_index("actor_role")
        audit_events_collection.create_index("action")
        audit_events_collection.create_index("created_at")

        # Payments collection
        payments_collection.create_index("user_id")
        payments_collection.create_index("updated_at")

        print("✅ Database indexes created successfully!")

    except Exception as e:
        print(f"❌ All primary connection attempts failed: {e}")
        print("💡 This might be a network or credential issue. Please check:")
        print("   1. Your internet connection")
        print("   2. MongoDB Atlas credentials")
        print("   3. Network firewall settings")
        raise