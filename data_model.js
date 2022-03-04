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
        for(let i = 0; i < this.skills.length; i++){
            const sk = this.skills[i];
            if(skill_name=== sk.name){
                if(sk.level >= level){
                    return true
                }else{
                    return false;
                }
            }
        }
        return false;
    }
}

module.exports = Contributor

class Skill {
    constructor(language, level) {
        this.language = language;
        this.level = level;
    }
    
    incLevel() {
        this.level += 1;
    }
}
module.exports = Skill

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

    addSkill(skill){
        this.skills.push(skill);
    }

    getSkillsList(){
        this.skills.map(s => s.language);
    }

    getSkill(skill_name){
        return this.skills.find(s.language === skill_name);
    }

    addContributorToSkill(skill, contributor) {
        if(Object.keys(this.contributors).includes(skill.language)){
            throw new Error("Repeated skill")
        }

        this.contributors[skill.language] = contributor
    }

    
    checkContributorsRequired() {
        
        for(skill in this.skills){
            
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
        for(skill in this.skills){
            output += this.contributors[skill.language].name + " ";
        }
        
        return output_string;
    }

}

module.exports = Project