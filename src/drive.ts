
import fs from 'fs';
import path from 'path';
import process from 'process';
import {drive_v3, google} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import {authenticate} from "@google-cloud/local-auth";

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
export async function loadSavedCredentialsIfExist(): Promise<OAuth2Client|null> {
    try {
        const content = await fs.promises.readFile(TOKEN_PATH, 'utf-8');
        const credentials = JSON.parse(content);
        // @ts-ignore
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
export async function saveCredentials(client: OAuth2Client) {
    const content = await fs.promises.readFile(CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.promises.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
export async function authorize() {
    let client: any = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

/**
 * Gets the folder with the given name from the given drive.
 * @param authClient the authenticated client
 * @param driveId the id of the drive to search
 * @param folderName the name of the folder to find
 */

export async function getFolder(authClient: OAuth2Client, driveId: string, folderName: string): Promise<drive_v3.Schema$File | null> {
    const drive = google.drive({version: 'v3', auth: authClient});

    try {
        const response = await drive.files.list({
            corpora: 'drive',
            driveId: driveId,
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
            q: "mimeType='application/vnd.google-apps.folder'",
        });

        const folders = response.data.files;

        if (folders) {
            return folders.filter((folder) => folder.name === folderName)[0];
        } else {
            return null
        }

    } catch (error) {
        console.error(`Error retrieving folder ${folderName}`, error);
    }
    return null;

}

/**
 * Gets the shared drive with the given name.
 * @param authClient the authenticated client
 * @param driveName the name of the drive to find
 */
export async function getSharedDrive(authClient: OAuth2Client, driveName: string): Promise<drive_v3.Schema$Drive | null> {
    const drive = google.drive({version: 'v3', auth: authClient});

    try {
        const response = await drive.drives.list();
        const sharedDrives = response.data.drives;
        if (sharedDrives){
            return sharedDrives.filter((drive: any) => drive.name === driveName)[0];
        }
        return null;
    } catch (error) {
        console.error(`Error retrieving shared drive ${driveName}`, error);
    }
    return null;
}

interface FileOptions {
    filePath: string,
    fileName: string,
}

interface DriveOptions {
    authClient: OAuth2Client,
    driveId: string,
    folderId: string,
}
export async function uploadFile(driveOptions: DriveOptions, fileOptions: FileOptions) {
    const drive = google.drive({version: 'v3', auth: driveOptions.authClient});
    console.log(`Uploading file ${fileOptions.fileName} to drive ${driveOptions.driveId}`)
    const requestBody = {
        'name': `${fileOptions.fileName}`,
        driveId: `${driveOptions.driveId}`,
        parents: [`${driveOptions.folderId}`],
    };
    const media = {
        mimeType: 'application/sql',
        body: fs.createReadStream(`${fileOptions.filePath}`)
    };


    drive.files.create({
        // @ts-ignore
        resource: requestBody,
        media: media,
         fields: 'id',
    }, function (err: any, file: any) {
        if (err) {
            // Handle error
            console.error(err);
        } else {
            console.log('File Id: ', file.id);
        }
    });
}
