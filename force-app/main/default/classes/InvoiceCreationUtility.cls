public class InvoiceCreationUtility {
    public class objectFieldRecordSObject{
        public Id origin_record;
        public Id account;
        public Date invoice_date;
        public Date invoice_due_date;
        public String child_relationship_name;
        public String line_item_description;
        public String line_item_quantity;
        public String line_item_unit_price;
    }
	@auraEnabled
    public static List<Sobject> fetchParentAndChildRecords(String objectFieldRecordJSON){
        objectFieldRecordSObject OFRRecord = (objectFieldRecordSObject)JSON.deserialize(objectFieldRecordJSON,objectFieldRecordSObject.class);
        String parentObjectAPIName = String.valueOf(OFRRecord.origin_record.getSObjectType());
        String stringQuery = 'SELECT Id, (SELECT Id,'
            			+OFRRecord.line_item_description+','
            			+OFRRecord.line_item_quantity+','
            			+OFRRecord.line_item_unit_price
            			+' FROM '+OFRRecord.child_relationship_name+') FROM '
            			+parentObjectAPIName+' WHERE ID =\''+OFRRecord.origin_record+'\'';
        return database.query(stringQuery);
    }
}