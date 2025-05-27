import { Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { PatternNameEnum } from "src/common/enums/pattern.enum";

@Controller('file')
export class FileController {

    @MessagePattern(PatternNameEnum.UPLOAD_FILE)
    async uploadFile(data: any) {
        // Here you would handle the file upload logic
        // For example, save the file to a storage service or database
        console.log('File upload data:', data);
        return { message: 'File uploaded successfully', data };
    }
}