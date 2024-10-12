import { LightningElement,wire,track} from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import fetchParentAndChildRecords from "@salesforce/apex/InvoiceCreationUtility.fetchParentAndChildRecords";
import createInvoiceFromJSON from "@salesforce/apex/InvoiceCreationUtility.createInvoiceFromJSON";
import { NavigationMixin } from 'lightning/navigation';

export default class CreateInvoice extends NavigationMixin(LightningElement) {
    @track dataToDisplayInTable = [];
    dataToSendToApex = {};
    showSpinner = false;
    showTable = true;
    showJSON = false;
    recordId;
    jsonObjectToDisplay;
    jsonStringToDisplay;
    jsonToCreateInvoice;
    
    @wire(CurrentPageReference)
    getPageReference({ state }) {
        this.recordId = state != null?state.c__origin_record:null;
        for(const [param,value] of Object.entries(state)){
            const key = param.replace('c__','');
            let val = value.replaceAll('"','');
            const rowEntry = {'param': key, 'value':val};
            this.dataToDisplayInTable.push(rowEntry);
            if(key === 'invoice_date' || key === 'invoice_due_date'){
                if(val != null && val.length >0){
                    const [day, month, year] = val.split('/');
                    val = `${year}-${month}-${day}`;
                }
            }
            if(val != null && val.length >0){
                this.dataToSendToApex[key] = val;
            }
        }
    }

    async getDataAndDisplayInJSON(){
        this.showTable = false;
        this.showSpinner = true;
        this.showJSON = true;
        try{
            const response = await fetchParentAndChildRecords({objectFieldRecordJSON: JSON.stringify(this.dataToSendToApex)});
            const returnData = response[0];
            this.jsonObjectToDisplay = {};
            this.jsonObjectToDisplay.Type = "ACCREC";
            this.jsonObjectToDisplay.Contact = {"ContactID":'00000'};
            this.jsonObjectToDisplay.DueDate = this.dataToSendToApex.invoice_due_date;
            if(returnData[this.dataToSendToApex.child_relationship_name] != null && returnData[this.dataToSendToApex.child_relationship_name].length >0){
                const lineItems = [];
                for(let i = 0; i < returnData[this.dataToSendToApex.child_relationship_name].length; i++){
                    const lineItem = returnData[this.dataToSendToApex.child_relationship_name][i];
                    lineItems.push({"Description":lineItem[this.dataToSendToApex.line_item_description],
                                    "Quantity": String(lineItem[this.dataToSendToApex.line_item_quantity]),
                                    "UnitAmount": String(lineItem[this.dataToSendToApex.line_item_unit_price]),
                                    "AccountCode": this.dataToSendToApex.account
                                    })
                }
                this.jsonObjectToDisplay.LineItems = lineItems;
            }
            this.jsonStringToDisplay = JSON.stringify(this.jsonObjectToDisplay,undefined,2);
            this.showSpinner = false;
        }
        catch(exception){
            console.log('Error occurred: '+exception.message);
        }
    }

    async createInvoice(){
        this.showSpinner = true;
        this.showJSON = false;
        try{
            this.jsonToCreateInvoice = {
                "Account__c": this.dataToSendToApex.account,
                "Invoice_Date__c": this.dataToSendToApex.invoice_date,
                "Due_Date__c": this.dataToSendToApex.invoice_due_date,
                "Invoice_Reference__c": this.recordId,
                "LineItems": this.jsonObjectToDisplay.LineItems
            };

            const newRecordId = await createInvoiceFromJSON({invoiceAndLineItemsJSON : JSON.stringify(this.jsonToCreateInvoice)});
            this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: newRecordId, // Newly created record's Id
                        actionName: 'view'    // Opens the record in view mode
                    }
                });
        }
        catch(exception){
            console.log('exception: '+ exception.message);
        }
    }
}