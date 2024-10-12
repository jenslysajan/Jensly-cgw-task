import { LightningElement,wire,track} from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import fetchParentAndChildRecords from "@salesforce/apex/InvoiceCreationUtility.fetchParentAndChildRecords";

export default class CreateInvoice extends LightningElement {
    @track dataToDisplayInTable = [];
    dataToSendToApex = {};
    showSpinner = false;
    showTable = true;
    showJSON = false;
    recordId;
    jsonStringToDisplay;
    
    @wire(CurrentPageReference)
    getPageReference({ state }) {
        this.recordId = state != null?state.c__origin_record:null;
        for(const [param,value] of Object.entries(state)){
            const key = param.replace('c__','');
            let val = value.replaceAll('"','');
            const rowEntry = {'param': key, 'value':val};
            this.dataToDisplayInTable.push(rowEntry);
            if(key === 'invoice_date' || key === 'invoice_due_date'){
                const [day, month, year] = val.split('/');
                val = `${year}-${month}-${day}`;
            }
            this.dataToSendToApex[key] = val;
        }
    }

    async getDataAndDisplayInJSON(){
        this.showTable = false;
        this.showSpinner = true;
        this.showJSON = true;
        try{
            console.log('calling apex111');
            const response = await fetchParentAndChildRecords({objectFieldRecordJSON: JSON.stringify(this.dataToSendToApex)});
            const returnData = response[0];
            const jsonObjectToDisplay = {};
            jsonObjectToDisplay.Type = "ACCREC";
            jsonObjectToDisplay.Contact = {"ContactID":'00000'};
            jsonObjectToDisplay.DueDate = this.dataToSendToApex.invoice_due_date;
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
                jsonObjectToDisplay.LineItems = lineItems;
            }
            this.jsonStringToDisplay = JSON.stringify(jsonObjectToDisplay,undefined,2);
            this.showSpinner = false;
        }
        catch(exception){
            console.log('Error occurred: '+exception.message);
        }
    }
}