const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Change provider
schema = schema.replace('provider = "postgresql"', 'provider = "mongodb"');

// Change standard IDs to MongoDB ObjectIds
schema = schema.replace(/id\s+String\s+@id @default\(uuid\(\)\)/g, 'id String @id @default(auto()) @map("_id") @db.ObjectId');

// Change foreign keys to ObjectIds
schema = schema.replace(/property_id\s+String\n/g, 'property_id String @db.ObjectId\n');
schema = schema.replace(/parent_case_id\s+String\?\n/g, 'parent_case_id String? @db.ObjectId\n');
schema = schema.replace(/assigned_staff_id\s+String\?\n/g, 'assigned_staff_id String? @db.ObjectId\n');
schema = schema.replace(/case_id\s+String\n/g, 'case_id String @db.ObjectId\n');
schema = schema.replace(/changed_by\s+String\n/g, 'changed_by String @db.ObjectId\n');
schema = schema.replace(/receipt_document_id\s+String\?\n/g, 'receipt_document_id String? @db.ObjectId\n');

// The uploaded_by in Document is currently just a String, but it should probably be an ObjectId referencing User if there's a relation.
// Wait, Document doesn't have a relation to User for uploaded_by in the current schema. So it can stay String for now.

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema updated for MongoDB!');
