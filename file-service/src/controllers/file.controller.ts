import { Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { PatternNameEnum } from "src/common/enums/pattern.enum";
import { BufferedFile } from "src/common/interfaces/file.interface";
import { FileService } from "src/services/file.service";

@Controller('file')
export class FileController {

    constructor(private readonly fileService:FileService){}
    @MessagePattern(PatternNameEnum.UPLOAD_FILE)
    async uploadFile(data: {file:BufferedFile,user:{email:string}}) {
 
        return this.fileService.uploadFile(data.file,data.user);
    }

    @MessagePattern(PatternNameEnum.LIST_FILES)
    async getUserFiles(data: {user:{email:string}}) {
        return this.fileService.getUserFiles(data.user);
    }
}