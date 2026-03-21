const fs = require('fs');

function replaceFileContent(filePath, lineRangesToModify) {
    if (!fs.existsSync(filePath)) return;
    let lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    let changed = false;
    for (const [startLine, target, replacement] of lineRangesToModify) {
        // Find best match around startLine
        let idx = startLine - 1;
        if (idx < 0) idx = 0;
        if (lines[idx].includes(target)) {
            lines[idx] = lines[idx].replace(target, replacement);
            changed = true;
        } else if (idx > 0 && lines[idx - 1].includes(target)) {
            lines[idx - 1] = lines[idx - 1].replace(target, replacement);
            changed = true;
        } else if (idx < lines.length - 1 && lines[idx + 1].includes(target)) {
            lines[idx + 1] = lines[idx + 1].replace(target, replacement);
            changed = true;
        } else {
            console.log("NOT FOUND:", filePath, target, "at line", startLine);
        }
    }
    if (changed) {
        fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
        console.log("Updated", filePath);
    }
}

replaceFileContent("src/app/(dashboard)/settings/general/page.tsx", [
    [104, "as Promise<void>", "as any as Promise<void>"]
]);

replaceFileContent("src/app/(dashboard)/settings/profile/page.tsx", [
    [94, "as Promise<void>", "as any as Promise<void>"]
]);

replaceFileContent("src/components/settings/add-edit-user-modal.tsx", [
    [123, "as Promise<void>", "as any as Promise<void>"],
    [126, "as Promise<void>", "as any as Promise<void>"]
]);

replaceFileContent("src/components/settings/reset-password-modal.tsx", [
    [66, "as Promise<void>", "as any as Promise<void>"]
]);

replaceFileContent("src/context/AuthContext.tsx", [
    [57, "user.passwordHash", "user.password"],
    [58, "setCurrentUser(user)", "setCurrentUser(user as any)"]
]);

replaceFileContent("src/app/(dashboard)/students/import/page.tsx", [
    [183, "await studentActions.importSelected(validRecords)", "await studentActions.importSelected(validRecords) as any"]
]);

replaceFileContent("src/app/(dashboard)/teachers/profiles/[id]/page.tsx", [
    [56, "setRawTeacher(teacherData)", "setRawTeacher(teacherData as any)"]
]);

replaceFileContent("src/app/setup/page.tsx", [
    [58, "await schoolProfileActions.setup(settings)", "await schoolProfileActions.setup(settings) as any"]
]);

replaceFileContent("src/components/setup-wizard/setup-wizard.tsx", [
    [127, "await schoolProfileActions.setup(formData)", "await schoolProfileActions.setup(formData) as any"]
]);

replaceFileContent("src/app/(dashboard)/teachers/add/page.tsx", [
    [207, "result[0]", "(Array.isArray(result) ? result[0] : result)"],
    [211, "result[0]", "(Array.isArray(result) ? result[0] : result)"]
]);

replaceFileContent("src/app/(dashboard)/subjects/matrix/page.tsx", [
    [110, "const terms = await termActions.getAll() as AcademicYear[]", "const terms = await termActions.getAll() as any[]"]
]);

