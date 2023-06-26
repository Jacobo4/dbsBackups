// Utility functions for Google Drive
import {authorize, getSharedDrive, getFolder, uploadFile} from "./drive";
// Functions to execute on a schedule (cron jobs)
import {dailyCron} from "./cronjobs";
// Allows us to execute shell commands
const {exec} = require('child_process');
// Allows us to read environment variables from a .env file
import 'dotenv/config'
// Allows us to work with file and directory paths
const path = require('path');


(async () => {

    const auth = await authorize();
    const uapaDrive = await getSharedDrive(auth, "UAPA");
    const backupsFolder = await getFolder(auth, uapaDrive?.id as string, 'Backups');
    const {filePath, fileName} = createDatabaseBackup('prueba', 'daily');
    await uploadFile(
        {
            authClient: auth,
            driveId: uapaDrive?.id as string,
            folderId: backupsFolder?.id as string
        },
        {
            filePath: filePath,
            fileName: fileName
        });


})
();

function doBackups(folderId: string) {
    dailyCron(() => {

    }, 'You will see this message every day at 4am')
}


function createDatabaseBackup(databaseName: string, peridodicity: string): any {
    const outputDir = `src/backups/${peridodicity}`;
    const fileName = `${databaseName}-${new Date().toLocaleDateString('ES-CO').replace(/\//g, '-')}.sql`;
    const outputFile = path.join(outputDir, fileName);
    const command = `MYSQL_PWD=${process.env.MYSQL_PASSWORD} mariadb-dump -u ${process.env.MYSQL_USER} ${databaseName} > ${outputFile}`

    exec(command, (error: any, stdout: string, stderr: string) => {
        if (error) {
            console.error('Backup creation failed:', error);
            return;
        }
        console.log(`Backup of database ${databaseName} created successfully! with the name ${fileName} at ${outputDir}`);
    });

    return {
        fileName: fileName,
        filePath: outputFile,
        fileDir: outputDir
    }
}


