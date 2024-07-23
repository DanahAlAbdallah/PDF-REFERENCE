import { Component, ViewChild, ElementRef, Input, SimpleChanges, effect, CreateEffectOptions } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import jsPDF from 'jspdf';
import { PDFSignalService } from 'src/app/signals/pdf-download.signal';
import 'jspdf-autotable';

@Component({
  selector: 'app-pdf-for-tables',
  templateUrl: './pdf-for-tables.component.html',
  styleUrls: ['./pdf-for-tables.component.scss']
})
export class PdfForTablesComponent {
  // @ViewChild('tablepdf', { static: false }) tablepdf: ElementRef;

  //MAIN DATA ARRAY
  @Input() ARRAY: any[] = [];

  //SOURCE OF THE PDF
  @Input() SOURCE: string = ''

  //COLUMNS TO DISPLAY IN HEADER
  @Input() displayedColumns: string[] = []

  //SENDING CUSTOMER NAME IN CASE OF INVOICE 
  @Input() CUSTOMERNAME: string = ''

  //SENDING IS CUSTOMER FLASG WHEN INVOICE
  @Input() WITHCUSTOMERNAME: boolean = false
  //DATASOURCE
  dataSource = new MatTableDataSource<any>(this.ARRAY); // Initialize with your data

  constructor(private pdfService: PDFSignalService) {

    effect(() => {
      if (this.pdfService.TABLE_PDF_DOWNLOAD()) {
        this.generatePDF()
      }
    });
  }

  //TRIGGER ARRAY CHANGES
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ARRAY']) {
      this.dataSource = new MatTableDataSource<any>(this.ARRAY);
    }
  }


  //FUNCTION TO GENERATE PDF
  generatePDF() {
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 10;
    const lineHeight = 10;
    const pageWidth = doc.internal.pageSize.width;

    // ADD LOGO TO THE TOP LEFT
    const logo = new Image();
    logo.src = './assets/image/daher.png';
    doc.addImage(logo, 'PNG', margin, 0, 50, 40);

    // ADD CREATED AT TO THE TOP RIGHT
    doc.setFontSize(12);
    const textX = pageWidth - margin - 60;
    let textY = 20;

    //SET THE TEXT COLOR
    doc.setTextColor(128, 128, 128);
    doc.text(`Created at: ${new Date().toLocaleDateString()}`, textX, textY + lineHeight);

// ADDRESS INFO
let addressY = 50; // STARTING Y POSITION FOR THE ADDRESS
let docWidth = doc.internal.pageSize.getWidth(); // Get the page width

doc.text('Daher Travel Agency', margin, addressY);
doc.text('Nabatieh, Hassan Kamel El Sabeh Street', margin, addressY + lineHeight);
doc.text('Sabbagh Center', margin, addressY + lineHeight * 2);
doc.text('07-768267 / 70-707694', margin, addressY + lineHeight * 3);

// CUSTOMER NAME IN CASE OF INVOICE
if (this.WITHCUSTOMERNAME) {
  let customerInfoX = docWidth - margin - doc.getTextWidth('Customer Name:');
  let customerNameX = docWidth - margin - doc.getTextWidth(this.CUSTOMERNAME);

  doc.text('Customer Name:', customerInfoX, addressY + lineHeight);
  doc.text(this.CUSTOMERNAME, customerNameX, addressY + lineHeight * 2)

    }

    // CALCULATE TABLE Y HEADER POSITION 
    const tableStartY = addressY + lineHeight * 5;

    // CUSTOMIZE TABLE COLUMNS
    const transformedData = this.dataSource.data.map(item => {
      return this.displayedColumns.map(column => {
        if (column === 'customer') {
          //SHOW CUTOMER NAME IF COLUMN IS CUSTOMER
          return item[column].name;
        } else if (['price', 'sell', 'cost', 'amount'].includes(column)) {
          //SHOW $ IF COLUMN IS PRICE, COST OR SELL
          return `$${item[column]}`;
        } else {
          return item[column];
        }
      });
    });

    // INITIALIZE PAGE NUMBER
    let pageNumber = 1;

    // GENERATE THE TABLE
    (doc as any).autoTable({
      head: [this.displayedColumns],
      body: transformedData,
      startY: tableStartY,
      styles: { fontSize: 10 },
      margin: { top: margin },
      headStyles: { fillColor: [0, 57, 107], textColor: [255, 255, 255] },
      didDrawPage: (data: { doc: any; }) => {

        //SHOW PAGE NUMBER AT THE BOTTOM OF EACH PAGE
        const pageCount = pageNumber++;
        doc.text(`Page ${pageCount}`, pageWidth - margin - 20, doc.internal.pageSize.height - margin);
      }
    });

    // SAVING THE PDF
let formattedDate
    // FORMAT THE PDF NAME AS SOURCE+DATE+TIME 
    const currentDate = new Date();
    if(this.WITHCUSTOMERNAME){
       formattedDate = `${this.SOURCE}-${this.CUSTOMERNAME}-${currentDate.getFullYear()}-${('0' + (currentDate.getMonth() + 1)).slice(-2)}-${('0' + currentDate.getDate()).slice(-2)}-${('0' + currentDate.getHours()).slice(-2)}:${('0' + currentDate.getMinutes()).slice(-2)} ${currentDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
    }else{
       formattedDate = `${this.SOURCE}-${currentDate.getFullYear()}-${('0' + (currentDate.getMonth() + 1)).slice(-2)}-${('0' + currentDate.getDate()).slice(-2)}-${('0' + currentDate.getHours()).slice(-2)}:${('0' + currentDate.getMinutes()).slice(-2)} ${currentDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
    }
    

    // SAVE THE PDF WITH THE FORMATTED TEXT
    doc.save(`${formattedDate}.pdf`);

    //RESET DOWNLOAD SIGNALS TO FALSE
    this.pdfService.resetDownload()

  }
}
