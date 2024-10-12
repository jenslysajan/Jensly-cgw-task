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
        
        public objectFieldRecordSObject(){
            this.origin_record = '';
            this.account = '';
            this.invoice_date = null;
            this.invoice_due_date = null;
            this.child_relationship_name ='';
            this.line_item_description = '';
            this.line_item_quantity = '';
            this.line_item_unit_price = '';
        }
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
    @auraEnabled
    public static String createInvoiceFromJSON(String invoiceAndLineItemsJSON){
        system.debug('string: '+invoiceAndLineItemsJSON);
        Map<String, Object> dataMap = (Map<String, Object>) JSON.deserializeUntyped(invoiceAndLineItemsJSON);
        System.debug('dataMap: '+dataMap);
        Invoice__c newInvoice = new Invoice__c(
        	Account__c = String.valueOf(dataMap.get('Account__c')),
            Due_Date__c = String.valueOf(dataMap.get('Due_Date__c')) != null?Date.valueOf(String.valueOf(dataMap.get('Due_Date__c'))+' '+'00:00:00'):null,
            Invoice_Date__c = String.valueOf(dataMap.get('Invoice_Date__c')) != null?Date.valueOf(String.valueOf(dataMap.get('Invoice_Date__c'))+' '+'00:00:00'):null,
            Invoice_Reference__c = String.valueOf(dataMap.get('Invoice_Reference__c'))
        );
        insert newInvoice;
        List<Line_Item__c> newLineItems = new List<Line_Item__c>();
        for(Object lineItem : (List<Object>)dataMap.get('LineItems')){
            System.debug('lineItem : '+lineItem);
            Map<String, Object> lineItemMap = (Map<String, Object>)lineItem;
            Line_Item__c newLineItem = new Line_Item__c(Invoice__c = newInvoice.Id,
                                                       	Line_Description__c = lineItemMap.get('Description')!= null ? String.valueOf(lineItemMap.get('Description')):null,
                                                        Quantity__c = lineItemMap.get('Quantity')!= null ? Integer.valueOf(lineItemMap.get('Quantity')):null,
                                                        Unit_Price__c = lineItemMap.get('UnitAmount')!= null ? Decimal.valueOf(String.valueOf(lineItemMap.get('UnitAmount'))):null
                                                       );
            newLineItems.add(newLineItem);
        }
        Insert newLineItems;
        return newInvoice.Id;
    }
}