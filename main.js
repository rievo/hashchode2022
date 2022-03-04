let fs = require('fs');


let PriorityQueue = require('./PriorityQueue.js')



// ===================================
// DATA MODEL
// ===================================
class Contributor{
    constructor(name){
        this.name = name
        this.skills = {}
        this.occupied = false;
    }
    
    addSkill(skill){
        this.skills[skill.language] = skill.level;
    }

    hasSkillWithLevel(skill_name, level){
        
        if(this.skills[skill_name] == undefined) return false;

        return this.skills[skill_name] >= level;

    }
}

class Skill {
    constructor(language, level) {
        this.language = language;
        this.level = level;
    }
    
    incLevel() {
        this.level += 1;
    }
}

class Project {
    
    constructor(name, days, score, deadline) {
        this.name = name;
        this.days = days; //Days to complete the project
        this.score = score; //Score awarded
        this.deadline = deadline; //Best before
        this.skills = [];   // Output order must be maintained
        this.contributors = {};
        this.started = false;
        this.completed = false;
    }

    expected_score(time){
        if(time > this.deadline) return 0;

        let expected_finish = time+this.days;

        let early_finish = this.deadline-this.days;

        return this.score + early_finish;
        
    }

    addSkill(skill){
        this.skills.push(skill);
    }

    getSkillsList(){
        this.skills.map(s => s.language);
    }

    getSkill(skill_name){
        return this.skills.find(s => s.language === skill_name);
    }

    addContributorToSkill(skill, contributor) {
        if(Object.keys(this.contributors).includes(skill.language)){
            throw new Error("Repeated skill")
        }

        this.contributors[skill.language] = contributor
    }

    
    checkContributorsRequired() {
        
        for(skill of this.skills){
            
            let skill_name = skill.language;

            if(this.contributors[skill_name] == undefined) return false; // No contributor for required skill
            
            let assigned_contributor = this.contributors[skill_name];
            
            if(assigned_contributor.skills[skill_name] >= skill.level) continue; // Assigned contributor has required level

            for (let other_contributor in Object.values(this.contributors)){
                if(other_contributor.skills[skill_name] >= skill.level) continue; // Other contributor has required level and is mentoring
            }

            return false;
            
        }

        return true;
        
    }
    
    simulateContributions(){
        
        if(Object.keys(this.contributors).length !== this.skills.length){
            throw new Error("Missing contributor for project")
        }

        // For each required skill
        for (const skill_name in this.contributors) {
            
            let contributor = this.contributors[skill_name]

            // If the required level is equal or greater than its current level for that skill
            if(this.getSkill(skill_name).level >= contributor.skills[skill_name]){
                
                // It's skill level is increased by one
                contributor.skills[skill_name]++;
            }
        }
    }

    generateOutputStringWithContributors() {
        let output_string = this.name +  "\n";
        for(skill of this.skills){
            output_string += this.contributors[skill.language].name + " ";
        }
        
        return output_string+"\n";
    }

}

// ===================================
// PROCESS DATA FILE
// ===================================
function processFile(data) {
    const contributors = [];
    const projects = [];    
    let availableSkills = {};

    parseFile(data, contributors, projects, availableSkills);

    // let solution = assignation(contributors, projects, availableSkills);
    let completed_projects = completeSimulation(contributors, projects, availableSkills);
    let completed = completed_projects.length
    let solution =  completed + "\n";
    completed_projects.forEach(p => {
        if(p.completed || p.started) {
            solution += p.generateOutputStringWithContributors();
        }
    })
    
    return solution;
}

module.exports.processFile = processFile;

// ===================================
// PARSE FILE
// ===================================
function parseFile(data, contributors, projects, availableSkills){

    const lines = data.split("\n");

    const numbers = lines[0].split(" ")
    const numContributors = parseInt(numbers[0])
    const numProjects = parseInt(numbers[1])

    let i = 1;
    let parsedContributors = 0;
    let parsedProjects = 0;

    while(parsedContributors < numContributors){

        // Read contributor header
        const contrib_head_line_parts = lines[i].split(" ");
        i+=1;
        
        const name = contrib_head_line_parts[0]
        const contrib = new Contributor(name)
        const numSkills = parseInt(contrib_head_line_parts[1])

        for(let r = i; r < numSkills+i; r++){
            const skillParts = lines[r].split(" ");
            const sk = new Skill(skillParts[0], parseInt(skillParts[1]))
            contrib.addSkill(sk);
        }
        i+= numSkills;
        parsedContributors += 1;
        contributors.push(contrib);
    }


    while(parsedProjects < numProjects){

        const projectHeaderParts = lines[i].split(" ");

        i+=1;

        const projectName = projectHeaderParts[0];
        const daysToComplete = parseInt(projectHeaderParts[1]);
        const scoreAwarded = parseInt(projectHeaderParts[2]);
        const bestBefore = parseInt(projectHeaderParts[3]);
        const numRoles = parseInt(projectHeaderParts[4]);


        const project = new Project(projectName, daysToComplete, scoreAwarded, bestBefore);


        for(let r = 0;  r < numRoles; r+=1){
            const skillParts = lines[r+i].split(" ");
            const sk = new Skill(skillParts[0], parseInt(skillParts[1]))
            project.addSkill(sk);
        }
        projects.push(project);
        i+= numRoles;
        parsedProjects += 1;
    
    }
    
    contributors.forEach(contributor => {
        for (let skill in contributor.skills) {
            if (Object.prototype.hasOwnProperty.call(contributor.skills, skill)) {
                if (availableSkills[skill.language] == undefined) {
                    availableSkills[skill.language] = new PriorityQueue((a, b) => a[1] > b[1]);
                }

                availableSkills[skill.language].push([contributor, skill.level]);
                // console.log("test: --------- " + availableSkills[skill.language].pop()[0].name)
            }
        }
    });

}

// ===================================
// ASSIGNATION ALGORITHM
// ===================================
function assignation(contributors, projects, availableSkills){

    let daysCounter = 0;
    let solution = "";

    let p = undefined;
    do{
        p = getProject();
        if(p === undefined){break;}
        sol_str = getContributorsToWorkOnProject(p);
        solution += sol_str
    }while(p != undefined)
    
    // console.log(solution);

    return solution;

    
      function getProject(){
        for(let i = 0; i < projects.length; i++){
            if(projects[i].completed == false){
                projects[i].completed = true;
                return projects[i];
            }
        }
        return undefined;
    }
    
    function getContributorsToWorkOnProject(project){
    
        let str = "" + project.name + "\n";
        for(let i = 0; i< project.skills.length; i++){
            const skill = project.skills[i];
            let contributors = availableSkills[skill.name].pop()
            if(contributors == undefined){
                contributors = []
            }
    
            for(let c = 0; c < contributors.length; c++){
                contributors[c].occupied = true;
                str += "" + contributors[c].name + " ";
                availableSkills[skill.name].push(contributors);
                break;
            }
        }
        
        str += "\n"
    
        return str; 
    }
    
}

function completeSimulation(contributors, projects, availableSkills) {
    // While can obtain rewards, simulate a day
    let remaing_score = 1; 
    let current_day = 0;

    let started_projects = [];
    const TIME_MULTIPLIER = 1; 
    do {

        console.log(`Current day: ${current_day}, remaining score ${remaing_score}`)
        simulateDay(contributors, projects, availableSkills, started_projects, TIME_MULTIPLIER, current_day);

        remaing_score = projects.filter(p => !p.started).reduce((s, p) => {
            s += p.score;
            return s;
        }, 0);
        
        current_day += 1*TIME_MULTIPLIER;

    } while (remaing_score > 0)

    return started_projects;
    
}

function simulateDay(contributors, projects, availableSkills, started_projects, TIME_MULTIPLIER, current_day){
    
    projects.forEach(project => {
        // Discount project value
        if(project.deadline < current_day){
            if (project.score > 0) {
                project.score -= 1*TIME_MULTIPLIER;
                // console.log("Reducing score")
            }
        }
        
        // Update active projects
        if(project.started && !project.completed){
            project.days -= 1*TIME_MULTIPLIER;
            if(project.days <= 0){
                project.completed = true;
                // Release contibutors and update skills
                project.simulateContributions(); // Update skills
                Object.values(contributors).forEach(contributor => {
                    contributor.occupied = false;
                });
                    
                console.log("Finished project")
            }
        }
    });

    // Get remaining projects in higher order value 
    let remaining_projects = projects.filter(p => !p.active && !p.completed);
    let ordered_projects = remaining_projects.sort((pa, pb) => pb.expected_score(current_day) - pa.expected_score(current_day));

    ordered_projects.forEach(p => {

        let required_skills = p.skills;

        let tentative_contributors = {};

        for (skill of required_skills){

            let tentative_contributors_names = Object.keys(tentative_contributors).map(c => c.name);

            let remaining_contributors = contributors.filter(c => !c.occupied)
                .filter(c => ! tentative_contributors_names.includes(c.name));

            
            // console.log(JSON.stringify(remaining_contributors))
                
            let possible_contributors = remaining_contributors.filter(c => c.hasSkillWithLevel(skill.language, skill.level));

            let ordered_contributors = possible_contributors.sort((ca, cb) => ca.skills[skill.language]-cb.skills[skill.language])

            if(ordered_contributors.length  == 0) break; // TODO: Check mentors

            tentative_contributors[skill.language] = ordered_contributors[0];
        }

        // Assignation is made
        if(Object.keys(tentative_contributors).length === required_skills.length) {
            Object.values(tentative_contributors).forEach(c => {c.occupied = true;})
            p.contributors = tentative_contributors;
        }

    })

    // Start those projects with all required contributors assigned
    projects.filter(p => ! p.started).forEach(p => {
        // Project may start, all contributors are assigned
        if(p.checkContributorsRequired()) {
            console.log("Started project")
            p.started = true;
            p.days -= 1;
            started_projects.push(p);
        }
    })
    
}


